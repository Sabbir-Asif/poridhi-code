const { PgInstrumentation } = require("@opentelemetry/instrumentation-pg");
const { MongoDbInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { MysqlInstrumentation } = require("@opentelemetry/instrumentation-mysql");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const {
  ExpressInstrumentation,
} = require("@opentelemetry/instrumentation-express");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { BatchSpanProcessor } = require("@opentelemetry/tracing");
const { Resource } = require("@opentelemetry/resources");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");
const {
  RedisInstrumentation,
} = require("@opentelemetry/instrumentation-redis");


function configureOpenTelemetry(serviceName) {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });
  provider.register();

  const exporter = new JaegerExporter({
    serviceName: serviceName,
    agentHost: "localhost",
    agentPort: 16686,
  });

  const spanProcessor = new BatchSpanProcessor(exporter);
  provider.addSpanProcessor(spanProcessor);

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new ExpressInstrumentation(),
      new RedisInstrumentation(),
      //new MongoDbInstrumentation(),
      //new MysqlInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  return provider;
}



module.exports = configureOpenTelemetry;