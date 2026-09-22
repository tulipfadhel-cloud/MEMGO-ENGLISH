// Official quiz content.
// Images are intentionally referenced by stable local asset paths.
// Correctness is always determined by correctImageId, never by visual position.

const imageAssets = Object.freeze({
  appropriate: "./assets/questions/appropriate.webp",
  avoid: "./assets/questions/avoid.webp",
  behave: "./assets/questions/behave.webp",
  calm: "./assets/questions/calm.webp",
  concern: "./assets/questions/concern.webp",
  content: "./assets/questions/content.webp",
  expect: "./assets/questions/expect.webp",
  frequently: "./assets/questions/frequently.webp",
  habit: "./assets/questions/habit.webp",
  instruct: "./assets/questions/instruct.webp"
});

const image = (id, key, alt) => Object.freeze({
  id,
  src: imageAssets[key],
  alt
});

export const quizData = Object.freeze([
  { id:"q-appropriate", word:"appropriate", sentence:"It is appropriate to wear a suit to a job interview.", images:[
    image("appropriate-interview","appropriate","A person wearing formal clothing in a professional interview"),
    image("appropriate-bus","expect","A person waiting at a public transport stop"),
    image("appropriate-reading","habit","A person reading quietly at night"),
    image("appropriate-family","behave","A child sitting calmly with family at a table")
  ], correctImageId:"appropriate-interview" },
  { id:"q-avoid", word:"avoid", sentence:"He stepped aside to avoid the broken glass on the floor.", images:[
    image("avoid-glass","avoid","A person carefully stepping away from an obstacle on the ground"),
    image("avoid-teacher","instruct","A teacher explaining a lesson to students"),
    image("avoid-child","content","A young child playing happily with a toy"),
    image("avoid-calendar","frequently","A calendar with several study days marked")
  ], correctImageId:"avoid-glass" },
  { id:"q-behave", word:"behave", sentence:"The children always behave well when guests visit.", images:[
    image("behave-family","behave","A child sitting calmly and politely with family at a table"),
    image("behave-glass","avoid","A person moving around an obstacle on a walkway"),
    image("behave-wait","expect","A person checking the time while waiting for transport"),
    image("behave-concern","concern","A person looking worried while reading information on a laptop")
  ], correctImageId:"behave-family" },
  { id:"q-calm", word:"calm", sentence:"Taking a warm bath makes her feel calm and relaxed.", images:[
    image("calm-lake","calm","A relaxed person meditating beside a quiet lake"),
    image("calm-interview","appropriate","A formally dressed person in a professional meeting"),
    image("calm-class","instruct","A teacher speaking to students in a classroom"),
    image("calm-calendar","frequently","A study calendar with repeated marked dates")
  ], correctImageId:"calm-lake" },
  { id:"q-concern", word:"concern", sentence:"She showed great concern after reading the news.", images:[
    image("concern-laptop","concern","A person looking worried while reading information on a laptop"),
    image("concern-calm","calm","A relaxed person sitting peacefully beside water"),
    image("concern-toy","content","A smiling child playing with a toy"),
    image("concern-reading","habit","A person reading a book before sleep")
  ], correctImageId:"concern-laptop" },
  { id:"q-content", word:"content", sentence:"The baby was completely content playing with his toy.", images:[
    image("content-toy","content","A smiling young child happily playing with a toy"),
    image("content-glass","avoid","A person stepping away from broken glass"),
    image("content-wait","expect","A person waiting and checking the time"),
    image("content-news","concern","A person reacting with worry to information on a screen")
  ], correctImageId:"content-toy" },
  { id:"q-expect", word:"expect", sentence:"She is standing at the station expecting the bus to arrive soon.", images:[
    image("expect-bus","expect","A person checking the time while waiting at a bus stop"),
    image("expect-family","behave","A child sitting politely with family"),
    image("expect-lake","calm","A person meditating beside a quiet lake"),
    image("expect-class","instruct","A teacher explaining something to a class")
  ], correctImageId:"expect-bus" },
  { id:"q-frequently", word:"frequently", sentence:"They meet frequently to study together after school.", images:[
    image("frequently-calendar","frequently","A calendar showing many recurring study dates"),
    image("frequently-interview","appropriate","A professional job interview"),
    image("frequently-toy","content","A child happily playing with a toy"),
    image("frequently-glass","avoid","A person avoiding an obstacle on the ground")
  ], correctImageId:"frequently-calendar" },
  { id:"q-habit", word:"habit", sentence:"Reading a book before sleep is a healthy daily habit.", images:[
    image("habit-reading","habit","A person reading a book in bed as part of a bedtime routine"),
    image("habit-calendar","frequently","A calendar with multiple repeated dates marked"),
    image("habit-concern","concern","A worried person reading information on a laptop"),
    image("habit-interview","appropriate","A person dressed formally for an interview")
  ], correctImageId:"habit-reading" },
  { id:"q-instruct", word:"instruct", sentence:"The teacher instructs the students on how to do the science experiment.", images:[
    image("instruct-teacher","instruct","A teacher guiding students step by step in a classroom"),
    image("instruct-wait","expect","A person waiting for public transport"),
    image("instruct-reading","habit","A person reading before sleep"),
    image("instruct-calm","calm","A person relaxing beside a peaceful lake")
  ], correctImageId:"instruct-teacher" }
]);