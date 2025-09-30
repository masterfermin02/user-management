/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import express from "express";
import * as admin from "firebase-admin";
import cors from "cors";
import {z} from "zod";
import {resolveZip} from "./helper";

const app = express();

export const _app = app; // for testing

app.use(cors({origin: true}));
app.use(express.json());
app.use((req, res, next) => {
  admin.initializeApp();

  next();
});

/** Schemas */
const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  zip: z.string().min(3).max(20),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  zip: z.string().min(3).max(20).optional(),
});


/** POST /users */
app.post("/users", async (req, res) => {
  try {
    const db = admin.database();
    const {name, zip} = createUserSchema.parse(req.body);
    const geo = await resolveZip(zip);

    const ref = db.ref("users");
    const now = Date.now();
    const user = {
      id: ref.key!,
      name,
      zip,
      lat: geo.lat,
      lon: geo.lon,
      timezone: geo.timezone,
      tzOffsetSec: geo.tzOffsetSec,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(user);
    res.status(201).json(user);
  } catch (err: any) {
    console.error("POST /users error:", err); // TEMP
    res.status(400).json({error: err.message ?? "Bad Request"});
  }
  return;
});

/** PATCH /users/:id */
app.patch("/users/:id", async (req, res) => {
  try {
    const db = admin.database();
    const {id} = req.params;
    const updates = updateUserSchema.parse(req.body);

    const ref = db.ref(`users/${id}`);
    const snap = await ref.get();
    if (!snap.exists()) return res.status(404).json({error: "Not found"});

    const current = snap.val();
    const next = {...current};

    if (typeof updates.name === "string") next.name = updates.name;

    if (typeof updates.zip === "string" && updates.zip !== current.zip) {
      const geo = await resolveZip(updates.zip);
      next.zip = updates.zip;
      next.lat = geo.lat;
      next.lon = geo.lon;
      next.timezone = geo.timezone;
      next.tzOffsetSec = geo.tzOffsetSec;
    }

    next.updatedAt = Date.now();
    await ref.set(next);
    res.json(next);
  } catch (err: any) {
    res.status(400).json({error: err.message ?? "Bad Request"});
  }
  return;
});

/** DELETE /users/:id */
app.delete("/users/:id", async (req, res) => {
  try {
    const db = admin.database();
    const {id} = req.params;
    const ref = db.ref(`users/${id}`);
    const snap = await ref.get();
    if (!snap.exists()) return res.status(404).json({error: "Not found"});

    await ref.remove();
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({error: err.message ?? "Bad Request"});
  }
  return;
});

/** (Optional) GET /users/:id */
app.get("/users/:id", async (req, res) => {
  try {
    const db = admin.database();
    const snap = await db.ref(`users/${req.params.id}`).get();
    if (!snap.exists()) return res.status(404).json({error: "Not found"});
    res.json(snap.val());
  } catch (err: any) {
    res.status(400).json({error: err.message ?? "Bad Request"});
  }
  return;
});

app.get("/helloWorld", async (req, res) => {
  logger.info("Hello logs!", {structuredData: true});
  res.send("Hello from Firebase!");
});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

export const api = onRequest(app);
