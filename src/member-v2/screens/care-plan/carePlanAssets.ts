// Care-plan images are resolved on the frontend from a fixed set of crops:
// each lifestyle category maps to a thumbnail, and sections either carry a
// doctor-chosen image_key or fall back to cycling through the set by order.
import breakfastBowlImage from "../../../../assets/care-plan/breakfast-bowl.png";
import chiaYoghurtImage from "../../../../assets/care-plan/chia-yoghurt.png";
import heartHealthFoodImage from "../../../../assets/care-plan/heart-health-food.png";
import sleepBedroomImage from "../../../../assets/care-plan/sleep-bedroom.png";
import sunlitPlantImage from "../../../../assets/care-plan/sunlit-plant.png";
import defaultDoctorAvatar from "../../../../assets/dashboard/doctors/farheen-nafisa-avatar.png";
import type { LifestyleCategory } from "./carePlanData";

export const CATEGORY_THUMBNAILS: Record<LifestyleCategory, string> = {
  Nutrition: heartHealthFoodImage,
  Exercise: sunlitPlantImage,
  Supplements: chiaYoghurtImage,
  Sleep: sleepBedroomImage,
};

/** The image set a doctor can pick from per focus area. Keys are what's
    persisted in care_plan_sections.image_key. */
export const SECTION_IMAGE_OPTIONS: Array<{ key: string; label: string; src: string }> = [
  { key: "breakfast-bowl", label: "Breakfast bowl", src: breakfastBowlImage },
  { key: "heart-health-food", label: "Heart-healthy food", src: heartHealthFoodImage },
  { key: "sunlit-plant", label: "Sunlit plant", src: sunlitPlantImage },
  { key: "sleep-bedroom", label: "Restful bedroom", src: sleepBedroomImage },
  { key: "chia-yoghurt", label: "Chia yoghurt", src: chiaYoghurtImage },
];

export function sectionImage(sortOrder: number): string {
  return SECTION_IMAGE_OPTIONS[sortOrder % SECTION_IMAGE_OPTIONS.length].src;
}

/** Doctor-chosen image when set, order-cycled fallback otherwise. */
export function resolveSectionImage(imageKey: string | null | undefined, sortOrder: number): string {
  const chosen = SECTION_IMAGE_OPTIONS.find((option) => option.key === imageKey);
  return chosen ? chosen.src : sectionImage(sortOrder);
}

export { defaultDoctorAvatar };
