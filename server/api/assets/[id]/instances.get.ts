export default defineEventHandler(async (event) => {
  // Public read access - no user auth required for collaborative work
  const { id } = event.context.params;
  const asset = await AssetModel.findOne({ _id: id, deletedAt: null });
  if (!asset) {
    return createError({
      statusCode: 404,
      statusMessage: "Asset not found",
    });
  }
  const instances = await InstanceModel.find({ assetId: id }).select('-__v').lean();
  return instances;
});
