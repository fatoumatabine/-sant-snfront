// Application Layer - Use Cases for Rendez-Vous
import { IRendezVousRepository } from '../../domain/repositories/IRendezVousRepository';
import { 
  RendezVous, 
  RendezVousRequest, 
  RendezVousListResponse,
  AvailableSlot 
} from '../../domain/models/RendezVous';
import { AppError } from '@/core/errors';

export class CreateRendezVousUseCase {
  constructor(private rendezVousRepository: IRendezVousRepository) {}

  async execute(data: RendezVousRequest): Promise<RendezVous> {
    // Validation
    if (!data.medecin_id || !data.date || !data.type || !data.motif) {
      throw new AppError('Veuillez remplir tous les champs requis', 400);
    }

    try {
      const rendezVous = await this.rendezVousRepository.create(data);
      return rendezVous;
    } catch (error: unknown) {
      const err = error as Error;
      throw new AppError(
        err.message || 'Erreur lors de la création du rendez-vous',
        500
      );
    }
  }
}

export class GetRendezVousListUseCase {
  constructor(private rendezVousRepository: IRendezVousRepository) {}

  async execute(): Promise<RendezVousListResponse> {
    try {
      return await this.rendezVousRepository.getAll();
    } catch (error: unknown) {
      const err = error as Error;
      throw new AppError(
        err.message || 'Erreur lors de la récupération des rendez-vous',
        500
      );
    }
  }
}

export class GetRendezVousByIdUseCase {
  constructor(private rendezVousRepository: IRendezVousRepository) {}

  async execute(id: number): Promise<RendezVous> {
    if (!id) {
      throw new AppError('ID du rendez-vous requis', 400);
    }

    try {
      const response = await this.rendezVousRepository.getById(id);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new AppError(
        err.message || 'Erreur lors de la récupération du rendez-vous',
        500
      );
    }
  }
}

export class CancelRendezVousUseCase {
  constructor(private rendezVousRepository: IRendezVousRepository) {}

  async execute(id: number): Promise<RendezVous> {
    if (!id) {
      throw new AppError('ID du rendez-vous requis', 400);
    }

    try {
      const response = await this.rendezVousRepository.cancel(id);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new AppError(
        err.message || 'Erreur lors de l\'annulation du rendez-vous',
        500
      );
    }
  }
}

export class ConfirmRendezVousUseCase {
  constructor(private rendezVousRepository: IRendezVousRepository) {}

  async execute(id: number): Promise<RendezVous> {
    if (!id) {
      throw new AppError('ID du rendez-vous requis', 400);
    }

    try {
      const response = await this.rendezVousRepository.confirm(id);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new AppError(
        err.message || 'Erreur lors de la confirmation du rendez-vous',
        500
      );
    }
  }
}

export class GetAvailableSlotsUseCase {
  constructor(private rendezVousRepository: IRendezVousRepository) {}

  async execute(medecinId: number, date: string): Promise<AvailableSlot[]> {
    if (!medecinId || !date) {
      throw new AppError('ID du médecin et date requis', 400);
    }

    try {
      return await this.rendezVousRepository.getAvailableSlots(medecinId, date);
    } catch (error: unknown) {
      const err = error as Error;
      throw new AppError(
        err.message || 'Erreur lors de la récupération des créneaux',
        500
      );
    }
  }
}

export class ProcessDemandeRendezVousUseCase {
  constructor(private rendezVousRepository: IRendezVousRepository) {}

  async execute(id: number, accept: boolean): Promise<RendezVous> {
    if (!id) {
      throw new AppError('ID de la demande requis', 400);
    }

    try {
      const response = await this.rendezVousRepository.processDemande(id, accept);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error;
      throw new AppError(
        err.message || 'Erreur lors du traitement de la demande',
        500
      );
    }
  }
}
