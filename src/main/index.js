const Ajv = require("ajv");
const extract = require("../extract");
const enrich = require("../enrich");
const cruiseResultSchema = require("../schema/cruise-result.schema.json");
const meta = require("../extract/transpile/meta");
const report = require("../report");
const normalizeFilesAndDirectories = require("./files-and-dirs/normalize");
const validateRuleSet = require("./rule-set/validate");
const normalizeRuleSet = require("./rule-set/normalize");
const validateOptions = require("./options/validate");
const normalizeOptions = require("./options/normalize");
const normalizeResolveOptions = require("./resolve-options/normalize");

// see [api.md](../../doc/api.md) and/ or the
// [type definition](../../types/depencency-cruiser.d.ts) for details
function format(pResult, pOutputType) {
  const ajv = new Ajv();

  validateOptions.validateOutputType(pOutputType);

  if (!ajv.validate(cruiseResultSchema, pResult)) {
    throw new Error(
      `The supplied dependency-cruiser result is not valid: ${ajv.errorsText()}.\n`
    );
  }
  return report.getReporter(pOutputType)(pResult);
}

function futureCruise(
  pFileAndDirectoryArray,
  pCruiseOptions,
  pResolveOptions,
  pTranspileOptions
) {
  pCruiseOptions = normalizeOptions(validateOptions(pCruiseOptions));

  if (Boolean(pCruiseOptions.ruleSet)) {
    pCruiseOptions.ruleSet = normalizeRuleSet(
      validateRuleSet(pCruiseOptions.ruleSet)
    );
  }
  const lNormalizedFileAndDirectoryArray = normalizeFilesAndDirectories(
    pFileAndDirectoryArray
  );
  const lCruiseResult = enrich(
    extract(
      lNormalizedFileAndDirectoryArray,
      pCruiseOptions,
      normalizeResolveOptions(
        pResolveOptions,
        pCruiseOptions,
        pTranspileOptions.tsConfig
      ),
      pTranspileOptions
    ),
    pCruiseOptions,
    lNormalizedFileAndDirectoryArray
  );

  return report.getReporter(pCruiseOptions.outputType)(lCruiseResult);
}

// see [api.md](../../doc/api.md) and/ or the
// [type definition](../../types/depencency-cruiser.d.ts) for details
function cruise(pFileAndDirectoryArray, pOptions, pResolveOptions, pTSConfig) {
  return futureCruise(pFileAndDirectoryArray, pOptions, pResolveOptions, {
    tsConfig: pTSConfig,
  });
}

module.exports = {
  cruise,
  futureCruise,
  format,
  allExtensions: meta.allExtensions,
  getAvailableTranspilers: meta.getAvailableTranspilers,
};
