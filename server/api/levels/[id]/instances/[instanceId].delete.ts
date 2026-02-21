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

  const level = await LevelModel.findById(id);
  if (!level) {
    return createError({
      statusCode: 404,
      statusMessage: "Level not found",
    });
  }

  const instance = await InstanceModel.findOne({ _id: instanceId, level: id });
  if (!instance) {
    return createError({
      statusCode: 404,
      statusMessage: "Instance not found",
    });
  }

  if (String(instance.user) !== String(userId)) {
    return createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  await InstanceModel.deleteOne({ _id: instanceId });

  return {
    success: true,
    id: instanceId,
  };
});
