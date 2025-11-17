import express from 'express';
import { adminLogin,adminSignup} from '../controllers/admin/adminController.js';
import {adminDashboardStats} from '../controllers/admin/adminDashboard.js'
import {pendingApprovalStats} from '../controllers/admin/adminUsercontroller.js'
import adminProtect from '../middleware/adminMiddleware.js'

const app = express.Router()

app.route('/').post(adminSignup).get(adminProtect,pendingApprovalStats)
app.route('/login').post(adminLogin)
app.route('/dashboard').get(adminDashboardStats)

export default app