import express from "express";
import { index, room } from "../controllers/mainController";
const globalRouter = express.Router();

globalRouter.get("/", index);

globalRouter.get("/:id", room);

export default globalRouter;
