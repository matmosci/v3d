import Mailer from "../services/mailer.service";

export default defineNitroPlugin(() => {
    Mailer.verify();
});