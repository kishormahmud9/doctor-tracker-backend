import { IAdminSafe } from "../models/admin.model";

declare global {
    namespace Express {
        interface Request {
            admin?: IAdminSafe;
        }
    }
}

export { };
