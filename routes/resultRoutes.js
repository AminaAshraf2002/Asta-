import express from 'express';
import { addResult,getAllResults,getResultsById,updateResults,resultStats } from '../controllers/admin/adminResultcontroller.js';
import {getUserResult} from '../controllers/user/userResult.js'
import adminProtect from "../middleware/adminMiddleware.js";
import protect from '../middleWare/userMiddleWare.js';

const app = express.Router();

app.route("/").post(addResult).get(getAllResults)
app.route('/students').get(protect,getUserResult)
app.route('/stats').get(resultStats)
app.route("/:id").get(getResultsById).put(updateResults)


export default app;
