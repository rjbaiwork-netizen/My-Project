import { Router } from "express";
import {
  getAdminSections,
  getPublicSections,
  toggleSectionVisibility,
  updateSection
} from "../controllers/sectionController";

const router = Router();

router.get("/sections", getPublicSections);
router.get("/admin/sections", getAdminSections);
router.patch("/admin/sections/:id", updateSection);
router.patch("/admin/sections/:id/visibility", toggleSectionVisibility);

export default router;
