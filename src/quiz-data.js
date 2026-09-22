// Replace only these temporary placeholder image URLs with the real MEMGO ENGLISH assets.
const placeholder = (seed) => `https://picsum.photos/seed/${seed}/900/650`;

export const quizData = Object.freeze([
  {
    id: "q1",
    word: "exhausted",
    sentence: "After running for two hours, Sara felt exhausted.",
    images: [
      { id: "q1-img-tired", src: placeholder("memgo-tired"), alt: "A person resting after physical activity" },
      { id: "q1-img-food", src: placeholder("memgo-food"), alt: "A person having a meal" },
      { id: "q1-img-laugh", src: placeholder("memgo-laugh"), alt: "A person smiling with friends" },
      { id: "q1-img-read", src: placeholder("memgo-read"), alt: "A person reading quietly" }
    ],
    correctImageId: "q1-img-tired"
  },
  {
    id: "q2",
    word: "crowded",
    sentence: "The train was crowded during the morning rush.",
    images: [
      { id: "q2-img-busy", src: placeholder("memgo-crowd"), alt: "Many people sharing a public space" },
      { id: "q2-img-empty", src: placeholder("memgo-empty"), alt: "A quiet open space" },
      { id: "q2-img-road", src: placeholder("memgo-road"), alt: "An outdoor road" },
      { id: "q2-img-room", src: placeholder("memgo-room"), alt: "A simple indoor room" }
    ],
    correctImageId: "q2-img-busy"
  },
  {
    id: "q3",
    word: "fragile",
    sentence: "Maya carried the fragile glass vase very carefully.",
    images: [
      { id: "q3-img-vase", src: placeholder("memgo-vase"), alt: "Hands carefully holding a glass object" },
      { id: "q3-img-ball", src: placeholder("memgo-ball"), alt: "A sports ball outdoors" },
      { id: "q3-img-book", src: placeholder("memgo-book"), alt: "A closed book on a table" },
      { id: "q3-img-shoe", src: placeholder("memgo-shoe"), alt: "A shoe on the floor" }
    ],
    correctImageId: "q3-img-vase"
  }
]);