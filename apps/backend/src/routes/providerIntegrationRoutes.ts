import {Router} from "express";
import {requireAdminAuth} from "../middleware/adminAuth.js";
import {beginIntegration,listIntegrations,storeProviderSecret} from "../controllers/providerIntegrationController.js";
const router=Router();
router.use(requireAdminAuth);
router.get("/",listIntegrations);
router.post("/:providerId/connect",beginIntegration);
router.post("/:providerId/credential",storeProviderSecret);
export default router;
