import { classes } from "./ClassesData";

export default function ClassesLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Clases y Subclases
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto mb-12">
        {classes.map((cls, idx) => {
          return (
            <div
              key={
                typeof cls.name === "string" || typeof cls.name === "number"
                  ? cls.name
                  : idx
              }
              className="border border-gray-700 rounded-lg p-6 bg-gray-900 shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-2">
                {cls.icon}
                <h2 className="text-2xl font-semibold">{cls.name}</h2>
              </div>

              {cls.passiveDefault && (
                <div className="text-sm text-gray-300 mb-4 pl-8">
                  <span className="font-semibold">
                    {cls.passiveDefault.name}:
                  </span>{" "}
                  {cls.passiveDefault.description}
                  {cls.passiveDefault.detail && (
                    <div className="text-gray-500 text-xs mt-1">
                      Detalle: {cls.passiveDefault.detail}
                    </div>
                  )}
                </div>
              )}

              <div>
                {cls.subclasses.map((sub, subIdx) => {
                  const isFirstSubclass = subIdx === 0;
                  const restPassives = Array.isArray(sub.passives)
                    ? sub.passives.filter(
                        (p) =>
                          !isFirstSubclass || p.name !== cls.passiveDefault.name
                      )
                    : [];

                  return (
                    <div
                      key={
                        typeof sub.name === "string" ||
                        typeof sub.name === "number"
                          ? sub.name
                          : undefined
                      }
                      className="mb-6 border border-gray-700 rounded-md p-4 bg-gray-800 hover:bg-gray-700 transition"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {sub.icon}
                        <h3 className="text-xl font-semibold">{sub.name}</h3>
                      </div>

                      <ul className="list-inside space-y-3 text-sm max-h-60 overflow-auto">
                        {restPassives.map((p) => (
                          <li key={p.name}>
                            <div>
                              <span className="font-semibold">{p.name}:</span>{" "}
                              {p.description}
                            </div>
                            {p.detail && (
                              <div className="text-gray-400 text-xs mt-1 pl-4">
                                Detalle: {p.detail}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
