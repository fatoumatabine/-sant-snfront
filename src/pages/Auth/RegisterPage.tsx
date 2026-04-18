import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Loader2, Plus, X,
  Mail, Lock, User, Phone, Stethoscope,
  CheckCircle2, FileText, ChevronRight, MapPin, Calendar,
  ShieldCheck, Clock, Zap, ArrowLeft,
} from 'lucide-react';
import { useAuthStore, getRedirectPath } from '@/store/authStore';
import { ErrorAlert } from '@/components/Common/Alert';
import { Antecedent } from '@/types';
import {
  AUTH_MIN_LENGTHS,
  AUTH_VALIDATION_MESSAGES,
  isValidGmailEmail,
} from '@/constants/authValidation';

/* ─── Password strength helper ─── */
function getStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: '', color: 'bg-gray-200' },
    { label: 'Faible', color: 'bg-red-400' },
    { label: 'Moyen', color: 'bg-orange-400' },
    { label: 'Bon', color: 'bg-[#249E94]' },
    { label: 'Fort', color: 'bg-[#005461]' },
  ];
  return { score, ...map[score] };
}

/* ─── Step metadata ─── */
const STEPS = [
  { id: 1, label: 'Compte', sublabel: 'Vos identifiants', Icon: User },
  { id: 2, label: 'Médical', sublabel: 'Dossier de santé', Icon: Stethoscope },
  { id: 3, label: 'Historique', sublabel: 'Antécédents', Icon: FileText },
];

/* ─── Right-panel benefits ─── */
const BENEFITS = [
  { Icon: ShieldCheck, text: 'Dossier médical 100 % sécurisé' },
  { Icon: Clock, text: 'Consultations disponibles 24h / 7j' },
  { Icon: Zap, text: 'Résultats et ordonnances instantanés' },
];

/* ─── Reusable field wrapper ─── */
const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-[#3BC1A8] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

/* ─── Reusable text input row ─── */
const InputRow: React.FC<{
  icon?: React.ReactNode;
  after?: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}> = ({ icon, after, children, active }) => (
  <div
    className={`flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3 transition-all duration-200
      ${active ? 'border-[#249E94] ring-2 ring-[#249E94]/20 bg-white' : 'border-gray-200 hover:border-[#3BC1A8]/60'}`}
  >
    {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
    <div className="flex-1 min-w-0">{children}</div>
    {after}
  </div>
);

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    dateNaissance: '',
    adresse: '',
    groupeSanguin: '',
    allergies: [] as string[],
    antecedents: [] as Antecedent[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [newAllergie, setNewAllergie] = useState('');
  const [newAntecedent, setNewAntecedent] = useState({
    type: 'medical' as Antecedent['type'],
    description: '',
    traitement: '',
  });

  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addAllergie = () => {
    if (newAllergie.trim()) {
      setFormData((prev) => ({ ...prev, allergies: [...prev.allergies, newAllergie.trim()] }));
      setNewAllergie('');
    }
  };

  const removeAllergie = (i: number) =>
    setFormData((prev) => ({ ...prev, allergies: prev.allergies.filter((_, idx) => idx !== i) }));

  const addAntecedent = () => {
    if (newAntecedent.description.trim()) {
      setFormData((prev) => ({
        ...prev,
        antecedents: [...prev.antecedents, { ...newAntecedent, id: `ant-${Date.now()}` }],
      }));
      setNewAntecedent({ type: 'medical', description: '', traitement: '' });
    }
  };

  const removeAntecedent = (i: number) =>
    setFormData((prev) => ({
      ...prev,
      antecedents: prev.antecedents.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (formData.password !== formData.confirmPassword) return;
    const success = await register({
      prenom: formData.prenom,
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone,
      password: formData.password,
      dateNaissance: formData.dateNaissance || undefined,
      adresse: formData.adresse || undefined,
      groupeSanguin: formData.groupeSanguin || undefined,
      allergies: formData.allergies,
      antecedents: formData.antecedents,
    });
    if (success) {
      const { user } = useAuthStore.getState();
      if (user) navigate(getRedirectPath(user.role));
    }
  };

  const pwdStrength = getStrength(formData.password);
  const passwordsMatch =
    formData.confirmPassword === '' || formData.password === formData.confirmPassword;
  const isGmailEmail = isValidGmailEmail(formData.email);
  const isTelephoneLongEnough = formData.telephone.trim().length >= AUTH_MIN_LENGTHS.telephone;
  const isPasswordLongEnough = formData.password.length >= AUTH_MIN_LENGTHS.password;

  const groupesSanguins = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const typesAntecedent = [
    { value: 'medical', label: 'Médical' },
    { value: 'chirurgical', label: 'Chirurgical' },
    { value: 'familial', label: 'Familial' },
    { value: 'allergie', label: 'Allergie' },
  ];

  return (
    <div className="min-h-screen bg-[#f0fafa] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#3BC1A8]/10 rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#005461]/10 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl">

          {/* ══════════════ LEFT – Form ══════════════ */}
          <div className="w-full lg:w-[58%] bg-white flex flex-col">

            {/* Top brand strip */}
            <div className="px-8 md:px-12 pt-8 pb-0 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  aria-label="Retour à l'accueil"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#005461] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <Link to="/" className="flex items-center gap-2 group">
                  <img src="/Sante sn.png" alt="Santé SN" className="h-9 w-9 rounded-xl object-contain group-hover:scale-105 transition-transform" />
                  <span className="font-bold text-lg font-display">
                    <span className="text-[#005461]">SANTÉ</span>
                    <span className="text-[#3BC1A8]"> SN</span>
                  </span>
                </Link>
              </div>
              <p className="text-sm text-gray-500 pb-1">
                Déjà inscrit ?{' '}
                <Link to="/auth/login" className="text-[#249E94] font-semibold hover:text-[#005461] transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>

            {/* Scrollable form area */}
            <div className="flex-1 overflow-y-auto px-8 md:px-12 py-8">
              {/* Title */}
              <div className="mb-7">
                <h1 className="text-2xl md:text-3xl font-bold font-display text-[#005461] mb-1">
                  Créer votre compte
                </h1>
                <p className="text-gray-500 text-sm">Rejoignez des milliers de patients au Sénégal</p>
              </div>

              {/* ── Step indicator ── */}
              <div className="flex items-center mb-8">
                {STEPS.map((s, idx) => {
                  const done = step > s.id;
                  const active = step === s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                            ${done
                              ? 'bg-[#005461] border-[#005461]'
                              : active
                              ? 'bg-white border-[#3BC1A8] shadow-md shadow-[#3BC1A8]/20'
                              : 'bg-white border-gray-200'}`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          ) : (
                            <s.Icon
                              className={`h-4 w-4 ${active ? 'text-[#3BC1A8]' : 'text-gray-300'}`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide ${
                            active ? 'text-[#005461]' : done ? 'text-[#249E94]' : 'text-gray-300'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-gray-200">
                          <div
                            className="h-full bg-[#3BC1A8] transition-all duration-500"
                            style={{ width: step > s.id ? '100%' : '0%' }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Error */}
              {error && <ErrorAlert message={error} onClose={clearError} className="mb-5" />}

              <form onSubmit={handleSubmit}>

                {/* ══ STEP 1 ══ */}
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-xs font-semibold text-[#3BC1A8] uppercase tracking-widest mb-2">
                      Étape 1 — Informations personnelles
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prénom" required>
                        <InputRow
                          icon={<User className="h-4 w-4" />}
                          active={focusedField === 'prenom'}
                        >
                          <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('prenom')}
                            onBlur={() => setFocusedField('')}
                            placeholder="Jean"
                            autoComplete="given-name"
                            required
                            className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                          />
                        </InputRow>
                      </Field>
                      <Field label="Nom" required>
                        <InputRow
                          icon={<User className="h-4 w-4" />}
                          active={focusedField === 'nom'}
                        >
                          <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('nom')}
                            onBlur={() => setFocusedField('')}
                            placeholder="Diallo"
                            autoComplete="family-name"
                            required
                            className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                          />
                        </InputRow>
                      </Field>
                    </div>

                    <Field label="Adresse email" required>
                      <InputRow
                        icon={<Mail className="h-4 w-4" />}
                        active={focusedField === 'email'}
                      >
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField('')}
                          placeholder="jean.diallo@gmail.com"
                          autoComplete="email"
                          required
                          className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                        />
                      </InputRow>
                      {formData.email && !isGmailEmail && (
                        <p className="text-xs text-red-500 mt-1">
                          {AUTH_VALIDATION_MESSAGES.gmail}
                        </p>
                      )}
                    </Field>

                    <Field label="Téléphone" required>
                      <InputRow
                        icon={<Phone className="h-4 w-4" />}
                        active={focusedField === 'telephone'}
                      >
                        <input
                          type="tel"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('telephone')}
                          onBlur={() => setFocusedField('')}
                          placeholder="+221 77 123 45 67"
                          autoComplete="tel"
                          required
                          className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                        />
                      </InputRow>
                      {formData.telephone && !isTelephoneLongEnough && (
                        <p className="text-xs text-red-500 mt-1">
                          Le numéro doit contenir au moins {AUTH_MIN_LENGTHS.telephone} caractères.
                        </p>
                      )}
                    </Field>

                    <Field label="Mot de passe" required>
                      <InputRow
                        icon={<Lock className="h-4 w-4" />}
                        active={focusedField === 'password'}
                        after={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      >
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField('')}
                          placeholder="Minimum 8 caractères"
                          autoComplete="new-password"
                          required
                          className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                        />
                      </InputRow>
                      {/* Password strength */}
                      {formData.password && (
                        <div className="mt-1.5">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                  i <= pwdStrength.score ? pwdStrength.color : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          {pwdStrength.label && (
                            <p className="text-xs text-gray-500">
                              Force du mot de passe :{' '}
                              <span className="font-semibold">{pwdStrength.label}</span>
                            </p>
                          )}
                        </div>
                      )}
                      {formData.password && !isPasswordLongEnough && (
                        <p className="text-xs text-red-500 mt-1">
                          {AUTH_VALIDATION_MESSAGES.password}
                        </p>
                      )}
                    </Field>

                    <Field label="Confirmer le mot de passe" required>
                      <InputRow
                        icon={<Lock className="h-4 w-4" />}
                        active={focusedField === 'confirmPassword'}
                        after={
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      >
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('confirmPassword')}
                          onBlur={() => setFocusedField('')}
                          placeholder="Répétez votre mot de passe"
                          autoComplete="new-password"
                          required
                          className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                        />
                      </InputRow>
                      {!passwordsMatch && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" /> Les mots de passe ne correspondent pas
                        </p>
                      )}
                      {formData.confirmPassword && passwordsMatch && (
                        <p className="text-xs text-[#249E94] mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Mots de passe identiques
                        </p>
                      )}
                    </Field>
                  </div>
                )}

                {/* ══ STEP 2 ══ */}
                {step === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-xs font-semibold text-[#3BC1A8] uppercase tracking-widest mb-2">
                      Étape 2 — Dossier médical
                    </p>

                    <Field label="Date de naissance">
                      <InputRow
                        icon={<Calendar className="h-4 w-4" />}
                        active={focusedField === 'dateNaissance'}
                      >
                        <input
                          type="date"
                          name="dateNaissance"
                          value={formData.dateNaissance}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('dateNaissance')}
                          onBlur={() => setFocusedField('')}
                          className="w-full bg-transparent text-sm text-gray-800 focus:outline-none"
                        />
                      </InputRow>
                    </Field>

                    <Field label="Groupe sanguin">
                      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 hover:border-[#3BC1A8]/60 rounded-xl px-4 py-3 transition-all">
                        <Stethoscope className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <select
                          name="groupeSanguin"
                          value={formData.groupeSanguin}
                          onChange={handleChange}
                          className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                        >
                          <option value="">Sélectionnez votre groupe sanguin</option>
                          {groupesSanguins.filter(Boolean).map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </Field>

                    <Field label="Adresse">
                      <InputRow
                        icon={<MapPin className="h-4 w-4" />}
                        active={focusedField === 'adresse'}
                      >
                        <input
                          type="text"
                          name="adresse"
                          value={formData.adresse}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('adresse')}
                          onBlur={() => setFocusedField('')}
                          placeholder="Votre adresse (optionnel)"
                          className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                        />
                      </InputRow>
                    </Field>

                    {/* Allergies */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Allergies connues</label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                          <input
                            type="text"
                            value={newAllergie}
                            onChange={(e) => setNewAllergie(e.target.value)}
                            placeholder="Ex: pénicilline, arachides…"
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergie())}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addAllergie}
                          className="w-10 h-10 bg-[#005461] hover:bg-[#0C7779] text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {formData.allergies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {formData.allergies.map((al, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 bg-[#e6f7f4] text-[#005461] border border-[#3BC1A8]/30 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              {al}
                              <button
                                type="button"
                                onClick={() => removeAllergie(i)}
                                className="hover:text-red-500 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ STEP 3 ══ */}
                {step === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-xs font-semibold text-[#3BC1A8] uppercase tracking-widest mb-2">
                      Étape 3 — Antécédents médicaux
                    </p>

                    {/* Add antecedent form */}
                    <div className="bg-[#f0fafa] border border-[#3BC1A8]/20 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-[#005461] uppercase tracking-wide mb-1">
                        Ajouter un antécédent
                      </p>
                      <select
                        value={newAntecedent.type}
                        onChange={(e) =>
                          setNewAntecedent((p) => ({ ...p, type: e.target.value as Antecedent['type'] }))
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#249E94]"
                      >
                        {typesAntecedent.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>

                      <textarea
                        value={newAntecedent.description}
                        onChange={(e) =>
                          setNewAntecedent((p) => ({ ...p, description: e.target.value }))
                        }
                        placeholder="Description de l'antécédent…"
                        rows={2}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#249E94] resize-none"
                      />

                      <input
                        type="text"
                        value={newAntecedent.traitement}
                        onChange={(e) =>
                          setNewAntecedent((p) => ({ ...p, traitement: e.target.value }))
                        }
                        placeholder="Traitement en cours (optionnel)"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#249E94]"
                      />

                      <button
                        type="button"
                        onClick={addAntecedent}
                        className="w-full bg-[#005461] hover:bg-[#0C7779] text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter l'antécédent
                      </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                      {formData.antecedents.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          Aucun antécédent ajouté (optionnel)
                        </p>
                      ) : (
                        formData.antecedents.map((ant, i) => (
                          <div
                            key={ant.id}
                            className="flex items-start gap-3 p-3 bg-white border border-[#3BC1A8]/20 rounded-xl"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="inline-block bg-[#e6f7f4] text-[#005461] text-xs font-semibold px-2 py-0.5 rounded-lg capitalize">
                                {ant.type}
                              </span>
                              <p className="text-sm text-gray-700 mt-1">{ant.description}</p>
                              {ant.traitement && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Traitement : {ant.traitement}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAntecedent(i)}
                              className="text-gray-300 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className="flex gap-3 mt-7 pt-5 border-t border-gray-100">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex-1 px-5 py-3 border-2 border-[#005461] text-[#005461] rounded-xl text-sm font-semibold hover:bg-[#e6f7f4] transition-colors"
                    >
                      ← Précédent
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      disabled={
                        step === 1 &&
                        (!formData.prenom ||
                          !formData.nom ||
                          !formData.email ||
                          !formData.telephone ||
                          !formData.password ||
                          !isGmailEmail ||
                          !isTelephoneLongEnough ||
                          !isPasswordLongEnough ||
                          !passwordsMatch)
                      }
                      className="flex-1 bg-[#005461] hover:bg-[#0C7779] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#005461]/20"
                    >
                      Continuer
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-[#3BC1A8] hover:bg-[#249E94] disabled:opacity-60 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#3BC1A8]/30"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Création du compte…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Créer mon compte
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ══════════════ RIGHT – Welcome Panel ══════════════ */}
          <div
            className="hidden lg:flex w-full lg:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
            style={{ background: '#0C7779' }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/10 rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                {/* Brand */}
                <div className="flex items-center gap-2 mb-10">
                  <img src="/Sante sn.png" alt="Santé SN" className="h-10 w-10 rounded-xl object-contain" />
                  <span className="text-white font-bold text-lg font-display">SANTÉ SN</span>
                </div>

                <h2 className="text-3xl font-bold font-display text-white leading-tight mb-3">
                  Votre santé,
                  <br />
                  <span className="text-[#3BC1A8]">simplifiée.</span>
                </h2>
                <p className="text-teal-100/80 text-sm leading-relaxed mb-8">
                  Créez votre compte pour profiter d'une gestion intelligente de vos rendez-vous, consultations et dossiers médicaux.
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-10">
                  {[
                    { label: 'Prise de rendez-vous rapide', desc: 'Choisissez votre médecin et vos créneaux en ligne' },
                    { label: 'Suivi de dossier', desc: 'Gardez votre historique médical toujours accessible' },
                    { label: 'Consultations à distance', desc: 'Bénéficiez de la télémédecine depuis chez vous' },
                  ].map(({ label, desc }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/10 border border-white/10"
                    >
                      <div className="w-1.5 h-1.5 bg-[#3BC1A8] rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-white text-sm font-semibold leading-none">{label}</p>
                        <p className="text-teal-100/70 text-xs mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom trust section */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                {BENEFITS.map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#3BC1A8]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3.5 w-3.5 text-[#3BC1A8]" />
                    </div>
                    <p className="text-teal-100/80 text-xs">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
