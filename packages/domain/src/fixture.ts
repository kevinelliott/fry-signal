import type { ShiftFixture } from "./types.js";

export const MIDNIGHT_MERGE = {
  id: "midnight-merge",
  version: 1,
  rulesVersion: 1,
  label: "Midnight Merge",
  durationTicks: 420,
  meals: [
    {
      id: "tender-box",
      label: "Tender Box",
      priceCents: 1_100,
      requirements: [
        { component: "chicken", quantity: 1 },
        { component: "waffle-fries", quantity: 1 },
      ],
    },
    {
      id: "biscuit-basket",
      label: "Biscuit Basket",
      priceCents: 1_450,
      requirements: [
        { component: "chicken", quantity: 1 },
        { component: "biscuit", quantity: 1 },
        { component: "slaw", quantity: 1 },
        { component: "drink", quantity: 1 },
      ],
    },
    {
      id: "night-bucket",
      label: "Night Bucket",
      priceCents: 2_600,
      requirements: [
        { component: "chicken", quantity: 2 },
        { component: "waffle-fries", quantity: 2 },
        { component: "biscuit", quantity: 2 },
        { component: "drink", quantity: 2 },
      ],
    },
  ],
  waves: [
    {
      id: "commuter-drift",
      label: "Commuter Drift",
      startsAtTick: 10,
      endsAtTick: 95,
      forecast: {
        minimumOrders: 3,
        maximumOrders: 4,
        dominantMeals: ["tender-box"],
        signalLeadTicks: 10,
      },
      announcedConstraint: null,
      orders: [
        { id: "mm-01", arrivalTick: 20, lane: "lane-1", mealId: "tender-box" },
        { id: "mm-02", arrivalTick: 38, lane: "lane-2", mealId: "tender-box" },
        { id: "mm-03", arrivalTick: 62, lane: "lane-1", mealId: "biscuit-basket" },
        { id: "mm-04", arrivalTick: 82, lane: "lane-2", mealId: "tender-box" },
      ],
    },
    {
      id: "rain-detour",
      label: "Rain Detour",
      startsAtTick: 120,
      endsAtTick: 230,
      forecast: {
        minimumOrders: 4,
        maximumOrders: 5,
        dominantMeals: ["biscuit-basket", "tender-box"],
        signalLeadTicks: 15,
      },
      announcedConstraint: "Wet lane paint sends new hot trays through the selected crossover.",
      orders: [
        { id: "mm-05", arrivalTick: 132, lane: "lane-2", mealId: "biscuit-basket" },
        { id: "mm-06", arrivalTick: 150, lane: "lane-1", mealId: "tender-box" },
        { id: "mm-07", arrivalTick: 171, lane: "lane-2", mealId: "biscuit-basket" },
        { id: "mm-08", arrivalTick: 197, lane: "lane-1", mealId: "tender-box" },
        { id: "mm-09", arrivalTick: 219, lane: "lane-2", mealId: "biscuit-basket" },
      ],
    },
    {
      id: "arena-let-out",
      label: "Arena Let-Out",
      startsAtTick: 255,
      endsAtTick: 365,
      forecast: {
        minimumOrders: 5,
        maximumOrders: 6,
        dominantMeals: ["night-bucket", "tender-box"],
        signalLeadTicks: 20,
      },
      announcedConstraint: null,
      orders: [
        { id: "mm-10", arrivalTick: 268, lane: "lane-1", mealId: "tender-box" },
        { id: "mm-11", arrivalTick: 285, lane: "lane-2", mealId: "night-bucket" },
        { id: "mm-12", arrivalTick: 305, lane: "lane-1", mealId: "biscuit-basket" },
        { id: "mm-13", arrivalTick: 326, lane: "lane-2", mealId: "tender-box" },
        { id: "mm-14", arrivalTick: 345, lane: "lane-1", mealId: "night-bucket" },
        { id: "mm-15", arrivalTick: 362, lane: "lane-2", mealId: "tender-box" },
      ],
    },
  ],
} as const satisfies ShiftFixture;
