import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.jsx";
const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// Health check endpoint
app.get("/make-server-f348aebd/health", (c) => {
  return c.json({ status: "ok" });
});

// Get available time slots for a therapist on a specific date
app.get("/make-server-f348aebd/availability/:therapistId/:date", async (c) => {
  try {
    const therapistId = c.req.param("therapistId");
    const date = c.req.param("date");

    // Get all bookings for this therapist on this date
    const prefix = `appointment:${therapistId}:${date}:`;
    const bookings = await kv.getByPrefix(prefix);

    // Extract booked times
    const bookedTimes = bookings.map((booking: any) => booking.time);

    return c.json({
      success: true,
      bookedTimes,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return c.json(
      {
        success: false,
        error: `Error fetching availability: ${error}`,
      },
      500
    );
  }
});

// Create a new appointment
app.post("/make-server-f348aebd/appointments", async (c) => {
  try {
    const body = await c.req.json();
    const { serviceId, therapistId, date, time, contact } = body;

    if (!serviceId || !therapistId || !date || !time || !contact) {
      return c.json(
        {
          success: false,
          error: "Missing required fields",
        },
        400
      );
    }

    // Check if this time slot is already booked
    const bookingKey = `appointment:${therapistId}:${date}:${time}`;
    const existingBooking = await kv.get(bookingKey);

    if (existingBooking) {
      return c.json(
        {
          success: false,
          error: "This time slot is already booked",
        },
        409
      );
    }

    // Create the appointment
    const appointment = {
      id: crypto.randomUUID(),
      serviceId,
      therapistId,
      date,
      time,
      contact,
      createdAt: new Date().toISOString(),
    };

    await kv.set(bookingKey, appointment);

    return c.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return c.json(
      {
        success: false,
        error: `Error creating appointment: ${error}`,
      },
      500
    );
  }
});

// Get all appointments for a specific user (by email)
app.get("/make-server-f348aebd/appointments/:email", async (c) => {
  try {
    const email = c.req.param("email");

    // Get all appointments
    const allAppointments = await kv.getByPrefix("appointment:");

    // Filter by email
    const userAppointments = allAppointments.filter(
      (apt: any) => apt.contact?.email === email
    );

    return c.json({
      success: true,
      appointments: userAppointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return c.json(
      {
        success: false,
        error: `Error fetching appointments: ${error}`,
      },
      500
    );
  }
});

Deno.serve(app.fetch);
