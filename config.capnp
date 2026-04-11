using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (
      name = "main",
      worker = .worker,
    ),
    (
      name = "relay-storage",
      disk = (
        writable = true,
        allowDotfiles = true,
      ),
    ),
  ],
  sockets = [
    (
      name = "http",
      address = "*:8080",
      service = "main",
      http = (),
    ),
  ],
);

const worker :Workerd.Worker = (
  modules = [
    (
      name = "worker",
      esModule = embed "dist-oci/index.js",
    ),
  ],
  compatibilityDate = "2026-04-11",
  durableObjectNamespaces = [
    (
      className = "RelayDurableObject",
      uniqueKey = "paseo-relay-oci-relaydurableobject-v1",
      enableSql = true,
    ),
  ],
  bindings = [
    (
      name = "RELAY",
      durableObjectNamespace = "RelayDurableObject",
    ),
  ],
  durableObjectStorage = (
    localDisk = "relay-storage",
  ),
);
