// Store mutable partagé entre ScrollController (GSAP) et la scène R3F (useFrame)
// Évite les re-renders React à chaque tick de scroll.
export const scrollStore = {
  progress: 0, // 0..1
  targetProgress: 0,
  reduced: false,
  ready: false,
  // lissé pour la caméra/mouvements
  smooth: 0,
  // progression d'impulsion globale pour les fils
  time: 0,
};
