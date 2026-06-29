import type { Question } from "@/lib/types";

/**
 * Free readiness diagnostic question set (DB4 sample).
 *
 * Every question and explanation is written ORIGINALLY (PRD-additions §3).
 * The production diagnostic is 30 questions, AI-drafted then human-reviewed;
 * this is a representative MVP subset spanning all three learner topics.
 */
export const READINESS_QUESTIONS: Question[] = [
  // ---- Road signs ----
  {
    id: "q-signs-1",
    topic: "signs",
    difficulty: 1,
    prompt: "You approach an eight-sided red sign. What must you do?",
    options: [
      "Slow down only if other cars are near",
      "Come to a complete stop, then go when it is safe",
      "Sound your hooter and continue",
      "Stop only at night",
    ],
    answer: 1,
    explanation:
      "An eight-sided (octagonal) red sign is always STOP. You must stop completely every time, then proceed only when the way is clear.",
    signCode: "R1",
  },
  {
    id: "q-signs-2",
    topic: "signs",
    difficulty: 1,
    prompt: "A downward-pointing triangle with a red border means:",
    options: ["Stop", "No entry", "Yield / give way", "Speed limit"],
    answer: 2,
    explanation:
      "A downward triangle with a red border is a yield sign. Slow down and give right of way; only stop if something is coming.",
    signCode: "R2",
  },
  {
    id: "q-signs-3",
    topic: "signs",
    difficulty: 2,
    prompt:
      "What is the difference between a no-entry sign and a one-way sign?",
    options: [
      "They mean the same thing",
      "No-entry forbids you from entering; one-way shows the permitted direction",
      "One-way forbids you; no-entry shows direction",
      "Both only apply to trucks",
    ],
    answer: 1,
    explanation:
      "A no-entry sign (red circle, white bar) forbids you from entering that road. A one-way sign (an arrow) simply shows the single direction traffic may travel.",
    signCode: "R3",
  },
  {
    id: "q-signs-4",
    topic: "signs",
    difficulty: 2,
    prompt: "A red circle with the number 60 inside it tells you that:",
    options: [
      "The recommended speed is 60 km/h",
      "You must drive exactly 60 km/h",
      "60 km/h is the maximum allowed",
      "There are 60 km to the next town",
    ],
    answer: 2,
    explanation:
      "A number in a red circle is a maximum speed limit. You may drive slower, but never faster than 60 km/h until another sign changes it.",
    signCode: "R201-60",
  },
  {
    id: "q-signs-5",
    topic: "signs",
    difficulty: 3,
    prompt:
      "A red circle crossed by two diagonal lines (rather than one) means:",
    options: ["No parking", "No stopping", "No overtaking", "No U-turn"],
    answer: 1,
    explanation:
      "Two crossing lines mean no stopping — stricter than no-parking (one line). You may not even pause to drop someone off.",
    signCode: "R217",
  },

  // ---- Rules of the road ----
  {
    id: "q-rules-1",
    topic: "rules",
    difficulty: 1,
    prompt:
      "At a four-way stop where two cars arrive at the same time, who goes first?",
    options: [
      "The faster car",
      "The car on the right",
      "The vehicle that arrived first; if simultaneous, the one on the right",
      "The larger vehicle",
    ],
    answer: 2,
    explanation:
      "First to arrive goes first. If two arrive together, the vehicle on the right has right of way.",
  },
  {
    id: "q-rules-2",
    topic: "rules",
    difficulty: 1,
    prompt: "What is the general following distance rule in good conditions?",
    options: [
      "Stay one car length behind",
      "Keep at least a two-second gap to the car ahead",
      "Always stay 100 m behind",
      "Following distance does not matter below 60 km/h",
    ],
    answer: 1,
    explanation:
      "Use the two-second rule: pick a fixed point, and you should pass it at least two seconds after the car ahead. Increase the gap in rain.",
  },
  {
    id: "q-rules-3",
    topic: "rules",
    difficulty: 2,
    prompt: "When may you cross a solid white line in the centre of the road?",
    options: [
      "Whenever the road is clear",
      "To overtake a slow vehicle",
      "Only to avoid an obstruction when it is safe",
      "Never, under any circumstances",
    ],
    answer: 2,
    explanation:
      "A solid line means no overtaking. You may only cross it when necessary to avoid an obstruction and only when it is safe to do so.",
  },
  {
    id: "q-rules-4",
    topic: "rules",
    difficulty: 2,
    prompt: "When approaching a pedestrian crossing with people waiting, you should:",
    options: [
      "Speed up to pass before they step out",
      "Stop and allow them to cross",
      "Hoot to warn them to wait",
      "Continue at the same speed",
    ],
    answer: 1,
    explanation:
      "Pedestrians have right of way at a crossing. Slow down, stop, and let them cross safely.",
  },
  {
    id: "q-rules-5",
    topic: "rules",
    difficulty: 3,
    prompt: "What should you do before changing lanes on a busy road?",
    options: [
      "Indicate, check mirrors, and check your blind spot, then move when safe",
      "Just indicate and move immediately",
      "Move first, then indicate",
      "Only check the mirror",
    ],
    answer: 0,
    explanation:
      "Signal your intention, check mirrors, then physically check the blind spot over your shoulder before moving. Mirrors alone miss the blind spot.",
  },

  // ---- Vehicle controls ----
  {
    id: "q-controls-1",
    topic: "controls",
    difficulty: 1,
    prompt: "Which pedal do you press to slow the vehicle down?",
    options: ["Accelerator", "Clutch", "Brake", "Handbrake button"],
    answer: 2,
    explanation:
      "The brake pedal (usually the middle pedal in a manual car) slows and stops the vehicle.",
  },
  {
    id: "q-controls-2",
    topic: "controls",
    difficulty: 1,
    prompt: "What is the clutch used for in a manual vehicle?",
    options: [
      "To make the car go faster",
      "To change gears smoothly by disconnecting the engine from the wheels",
      "To sound the hooter",
      "To switch on the lights",
    ],
    answer: 1,
    explanation:
      "Pressing the clutch temporarily disconnects the engine from the wheels so you can change gears without grinding them.",
  },
  {
    id: "q-controls-3",
    topic: "controls",
    difficulty: 2,
    prompt: "Before driving off, the first thing you should do after getting in is:",
    options: [
      "Start the engine immediately",
      "Adjust your seat, mirrors, and fasten your seatbelt",
      "Select fifth gear",
      "Switch on the radio",
    ],
    answer: 1,
    explanation:
      "Set up your seat and mirrors and belt up first so you have full control and visibility before the car moves.",
  },
  {
    id: "q-controls-4",
    topic: "controls",
    difficulty: 2,
    prompt: "When should you use the handbrake?",
    options: [
      "Only when the car breaks down",
      "When parked, and to help hold the car on a hill start",
      "While driving at high speed",
      "Never — it is only for emergencies",
    ],
    answer: 1,
    explanation:
      "The handbrake holds the car still when parked and helps prevent rolling back during a hill start.",
  },
  {
    id: "q-controls-5",
    topic: "controls",
    difficulty: 3,
    prompt: "What does it usually mean if a red warning light stays on after starting?",
    options: [
      "The car is working perfectly",
      "It is just a decoration",
      "Something needs attention — check before driving",
      "You must drive faster to clear it",
    ],
    answer: 2,
    explanation:
      "A red warning light that stays on signals a fault (such as oil, brakes, or battery). Investigate before driving to avoid damage or danger.",
  },
];
