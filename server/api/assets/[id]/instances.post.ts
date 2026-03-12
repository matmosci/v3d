export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
  const { id } = event.context.params;

  const allowedSourceTypes = new Set(["file", "builtin", "custom", "asset"]);
  const requestedSourceType = typeof body?.sourceType === "string" ? body.sourceType : "file";
  const sourceType = allowedSourceTypes.has(requestedSourceType) ? requestedSourceType : "file";
  const sourceId = typeof body?.sourceId === "string" && body.sourceId
    ? body.sourceId
    : (typeof body?.fileId === "string" && body.fileId
      ? body.fileId
      : (typeof body?.asset === "string" ? body.asset : ""));

  if (!sourceId) {
    return createError({
      statusCode: 400,
      statusMessage: "Missing sourceId",
    });
  }

  const asset = await AssetModel.findById(id);
  if (!asset) {
    return createError({
      statusCode: 404,
      statusMessage: "Asset not found",
    });
  };

  // Check if user is the asset owner (future: expand to check collaborator permissions)
  if (asset.user.toString() !== user.id) {
    return createError({
      statusCode: 403,
      statusMessage: "You don't have permission to add instances to this asset",
    });
  }

  const instance = await InstanceModel.create({
    assetId: id,
    sourceType,
    sourceId,
    fileId: sourceType === "file" ? sourceId : undefined,
    user: user.id,
    position: Array.isArray(body.position) ? body.position : [0, 0, 0],
    quaternion: Array.isArray(body.quaternion) ? body.quaternion : [0, 0, 0, 1],
    scale: Array.isArray(body.scale) ? body.scale : [1, 1, 1],
  });

  return instance;
});
