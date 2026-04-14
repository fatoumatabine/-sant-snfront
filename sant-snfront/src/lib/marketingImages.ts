const pexels = (photoId: string, width: number = 1200) =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

export const marketingImages = {
  homeHero: pexels('19218034', 900),
  homeAbout: pexels('7653119', 1200),
  homeServiceLab: pexels('34642915', 1200),
  homeServiceDoctors: pexels('6303652', 1200),
  homeDoctorGeneral: pexels('19963130', 700),
  homeDoctorCardio: pexels('19596247', 700),
  homeDoctorPediatrics: pexels('5452256', 700),
  homeDoctorSurgery: pexels('19963164', 700),
  publicServicesHero: '/scaled.jpg',
  publicDoctorsHero: pexels('7446987', 1200),
  publicAboutHero: pexels('31689272', 1200),
  publicAboutMission: pexels('7653091', 1200),
  publicContactHero: pexels('19957212', 1200),
  specialtyCardiology: pexels('6303645', 1200),
  specialtyPediatrics: pexels('7653119', 1200),
  specialtyMental: pexels('33055499', 1200),
  specialtyLabs: pexels('34642915', 1200),
  specialtyFamily: pexels('7653091', 1200),
  specialtyUrgency: pexels('6098063', 1200),
  specialtySurgery: pexels('18828740', 1200),
  specialtyDefault: pexels('19218034', 1200),
} as const;

