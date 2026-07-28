import type { Transition } from "motion/react";

/** Shared spring for modal/panel surfaces entering and exiting. */
export const modalSpring: Transition = { type: "spring", bounce: 0, duration: 0.35 };

/** Shared fade for modal backdrops. */
export const backdropFade: Transition = { duration: 0.2 };
