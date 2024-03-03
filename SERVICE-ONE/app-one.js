const configureOpenTelemetry = require("./tracing");

const express = require("express");
const app = express();
const port = 3000;
const { trace, context, propagation } = require("@opentelemetry/api");
const tracerProvider = configureOpenTelemetry("start");
const axios = require("axios");

app.use((req, res, next) => {
  const tracer = tracerProvider.getTracer("express-tracer");
  const span = tracer.startSpan("in_req");

  // Add custom attributes or log additional information if needed
  span.setAttribute("user", "user made");

  // Pass the span to the request object for use in the route handler
  context.with(trace.setSpan(context.active(), span), () => {
    next();
  });
});


app.get("/getuser", async (req, res) => {
  const parentSpan = trace.getSpan(context.active());

  try {
    const user = {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
    };

    if (parentSpan) {
      parentSpan.setAttribute("user.id", user.id);
      parentSpan.setAttribute("user.name", user.name);
    }

    const startTime = Date.now(); // Record the start time for service-level delay

    const validateResponse = await context.with(
      trace.setSpan(context.active(), parentSpan),
      async () => {
        const carrier = {};
        propagation.inject(context.active(), carrier);

        const response = await axios.get("http://service-two:6000/validateuser", {
          headers: carrier,
        });

        // Calculate and log service-level delay
        const serviceLevelDelay = Date.now() - startTime;
        console.log("Service-level delay:", serviceLevelDelay, "ms");

        return response;
      }
    );

    console.log("Validation response:", validateResponse.data);
    res.json(user);
  } catch (error) {
    if (parentSpan) {
      parentSpan.recordException(error);
    }
    res.status(500).send(error.message);
  } finally {
    if (parentSpan) {
      parentSpan.end();
    }
  }
});


// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Gracefully shut down the OpenTelemetry SDK and the server
const gracefulShutdown = () => {
  server.close(() => {
    console.log("Server stopped");
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.error("Error shutting down tracing", error))
      .finally(() => process.exit(0));
  });
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);