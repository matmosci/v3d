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

  // Find entity - publicly readable for collaborative work
  const entity = await EntityModel.findOne({ _id: id, deletedAt: null });
  if (!entity) {
    return createError({
      statusCode: 404,
      statusMessage: "Entity not found",
    });
  }

  const instance = await InstanceModel.findOne({ _id: instanceId, entity: id });
  if (!instance) {
    return createError({
      statusCode: 404,
      statusMessage: "Instance not found",
    });
  }

  // Check ownership - future: expand to check if user has modify permissions on entity/instance
  if (String(instance.user) !== String(userId)) {
    return createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  await InstanceModel.deleteOne({ _id: instanceId });

  return { success: true };
});
