export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const params = event.context.params || {};
  const id = params.id;
  const instanceId = params.instanceId;

  if (!id || !instanceId) {
    return createError({
      statusCode: 400,
      statusMessage: "Missing route params",
    });
  }

  const sessionUser = user as any;
  const userId = sessionUser.id || sessionUser._id;

  // Find asset - publicly readable for collaborative work
  const asset = await AssetModel.findOne({ _id: id, deletedAt: null });
  if (!asset) {
    return createError({
      statusCode: 404,
      statusMessage: "Asset not found",
    });
  }

  const instance = await InstanceModel.findOne({ _id: instanceId, assetId: id });
  if (!instance) {
    return createError({
      statusCode: 404,
      statusMessage: "Instance not found",
    });
  }

  // Check ownership - future: expand to check if user has modify permissions on asset/instance
  if (String(instance.user) !== String(userId)) {
    return createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  await InstanceModel.deleteOne({ _id: instanceId });

  return { success: true };
});
