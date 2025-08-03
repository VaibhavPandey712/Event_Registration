import express from "express";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "world",
    password: "1234",
    port: 5432,
});
db.connect();


const app = express();
const port = 3001;
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); 

app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.render("index", { user: null });
});
app.post("/submit", async (req, res) => {
    const id = req.body.id;

    try {
        const result = await db.query("SELECT * FROM eventregistration WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.render("index", { user: null }); 
        }

        const user = result.rows[0];
        res.render("index", { user });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Internal server error");
    }
});








app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
