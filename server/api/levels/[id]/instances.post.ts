export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
  const { id } = event.context.params;

  const allowedSourceTypes = new Set(["asset", "builtin", "custom"]);
  const requestedSourceType = typeof body?.sourceType === "string" ? body.sourceType : "asset";
  const sourceType = allowedSourceTypes.has(requestedSourceType) ? requestedSourceType : "asset";
  const sourceId = typeof body?.sourceId === "string" && body.sourceId
    ? body.sourceId
    : (typeof body?.asset === "string" ? body.asset : "");

  if (!sourceId) {
    return createError({
      statusCode: 400,
      statusMessage: "Missing sourceId",
    });
  }

  const level = await LevelModel.findById(id);
  if (!level) {
    return createError({
      statusCode: 404,
      statusMessage: "Level not found",
    });
  };

  const instance = await InstanceModel.create({
    level: id,
    sourceType,
    sourceId,
    asset: sourceType === "asset" ? sourceId : undefined,
    user: user.id,
    position: Array.isArray(body.position) ? body.position : [0, 0, 0],
    quaternion: Array.isArray(body.quaternion) ? body.quaternion : [0, 0, 0, 1],
    scale: Array.isArray(body.scale) ? body.scale : [1, 1, 1],
  });

  return instance;
});
