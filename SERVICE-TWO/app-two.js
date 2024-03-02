const express = require("express");
const app = express();

const port = 6000;
const configureOpenTelemetry = require("./tracing");
configureOpenTelemetry("validate");
const { context, trace, propagation } = require("@opentelemetry/api");
app.get("/validateuser", (req, res) => {
  const ctx = propagation.extract(context.active(), req.headers);
  const tracer = trace.getTracer("express-tracer");

  const span = tracer.startSpan(
    "validate-user",
    {
      attributes: { "http.method": "GET", "http.url": req.url },
    },
    ctx
  );

  // Simulate some processing
  setTimeout(() => {
    // Attach custom data to the span
    span.setAttribute("customData", "some custom data");

    span.end();
    res.json({ success: true });
  }, 500); // Simulating processing time
});


app.listen(port, () => {
  console.log(`App two listening at http://localhost:${port}`);
});