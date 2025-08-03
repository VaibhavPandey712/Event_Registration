import express from "express";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";
import path from "path";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
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
const port = 3000;
app.use(express.static(path.join(__dirname, "public")));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "public", "index.html"));

});
app.post("/submit", async (req, res) => {
    
    const { name, age, mono, email, activity, grpname } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const values = [name, age, mono, email, activity, grpname, today];
    console.log(values);
    try {
        const result = await db.query(
            `INSERT INTO eventregistration (Name, Age, MobileNumber, Email, Event, GroupName, submissiondate)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            values
        );

        const id = result.rows[0].id;
        
        const qrURL = `http://localhost:${port}/view/${id}`;
        const qrImage = await QRCode.toDataURL(qrURL);

        res.send(`
            <h2>Registration Successful ✅</h2>
            <p>Your Registration ID: <strong>${id}</strong></p>
            
        `);
    } catch (err) {
        console.error("DB Error:", err);
        res.status(500).send("Error saving your data. Please try again.");
    }
});


app.get("/view/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query("SELECT * FROM EventRegistration WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).send("Registration not found.");
        }

        const user = result.rows[0];
        

     
        res.setHeader("Content-Type", "application/pdf");


        const doc = new PDFDocument();
        doc.pipe(res);
        doc.fontSize(20).text("Event Registration", { align: "center" }).moveDown();

        doc.fontSize(12)
            .text(`ID: ${user.id}`)
            .text(`Name: ${user.name}`)
            .text(`Age: ${user.age}`)
            .text(`Mobile Number: ${user.mobilenumber}`)
            .text(`Email: ${user.email}`)
            .text(`Event: ${user.event}`)
            .text(`Group Name: ${user.groupname}`)
            .text(`Date: ${user.today}`);

        doc.end();
    } catch (err) {
        console.error("PDF error:", err);
        res.status(500).send("Error generating PDF.");
    }
});




app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
