export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
  const { id } = event.context.params;

  const level = await LevelModel.findById(id);
  if (!level) {
    return createError({
      statusCode: 404,
      statusMessage: "Level not found",
    });
  };

  const instance = await InstanceModel.create({
    level: id,
    asset: body.asset,
    user: user.id,
    matrix: body.matrix
  });

  return instance;
});
