import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import companiesRouter from "./companies";
import requirementsRouter from "./requirements";
import candidatesRouter from "./candidates";
import pipelineRouter from "./pipeline";
import screeningRouter from "./screening";
import assessmentsRouter from "./assessments";
import clientInterviewsRouter from "./client-interviews";
import offersRouter from "./offers";
import joiningRouter from "./joining";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(companiesRouter);
router.use(requirementsRouter);
router.use(candidatesRouter);
router.use(pipelineRouter);
router.use(screeningRouter);
router.use(assessmentsRouter);
router.use(clientInterviewsRouter);
router.use(offersRouter);
router.use(joiningRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);

export default router;
