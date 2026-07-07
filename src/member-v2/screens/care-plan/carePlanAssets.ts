// Care-plan images are resolved on the frontend (the doctor editor doesn't
// pick images): each lifestyle category maps to a thumbnail, and sections
// cycle through a small set of hero crops by their order.
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

const SECTION_IMAGES = [
  breakfastBowlImage,
  heartHealthFoodImage,
  sunlitPlantImage,
  sleepBedroomImage,
  chiaYoghurtImage,
];

export function sectionImage(sortOrder: number): string {
  return SECTION_IMAGES[sortOrder % SECTION_IMAGES.length];
}

export { defaultDoctorAvatar };
