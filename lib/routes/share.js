module.exports = (crowi, app) => {
  "use strict";

  var debug = require("debug")("crowi:routes:share"),
    Share = crowi.model("Share"),
    ApiResponse = require("../util/apiResponse"),
    sprintf = require("sprintf"),
    actions = {};

  async function renderPage(pageData, req, res) {
    var renderVars = {
      path: pageData.path,
      page: pageData,
      revision: pageData.revision || {},
      author: pageData.revision.author || false
    };

    try {
      const tree = Revision.findRevisionList(pageData.path, {});
      renderVars.tree = tree;
      res.render("page_share", renderVars);
    } catch (err) {
      debug("Error: renderPage()", err);
      res.redirect("/");
    }
  }

  actions.pageShow = async (req, res) => {
    const { id } = req.params;

    try {
      const pageData = Page.findPageById(id);
      return renderPage(page, req, res);
    } catch (err) {
      console.log(err);
      return res.redirect("/");
    }
  };

  const api = (actions.api = {});

  api.list = async (req, res) => {
    const { page_id } = req.body;

    if (page_id === null) {
      return res.json(ApiResponse.error("Parameters page_id are required."));
    }

    try {
      const shareData = await Share.find({ 'page.id': page_id });
      console.log(shareData);
      const result = { share: shareData };
      return res.json(ApiResponse.success(result));
    } catch (err) {
      return res.json(ApiResponse.error(err));
    }
  };

  /**
   * @api {post} /shares.create Create new share
   * @apiName CreateShare
   * @apiGroup Share
   *
   * @apiParam {String} id
   * @apiParam {String} page_id
   */
  api.create = async (req, res) => {
    const { id, page_id } = req.body;

    if (id === null || page_id === null) {
      return res.json(
        ApiResponse.error("Parameters id and page_id are required.")
      );
    }

    try {
      const shareData = await Share.create(id, page_id, req.user);
      if (!shareData) {
        throw new Error("Failed to create share.");
      }
      const result = { share: shareData.toObject() };
      return res.json(ApiResponse.success(result));
    } catch (err) {
      return res.json(ApiResponse.error(err));
    }
  };

  /**
   * @api {post} /shares.delete Delete share
   * @apiName DeleteShare
   * @apiGroup Share
   *
   * @apiParam {String} page_id Page Id.
   */
  api.delete = async (req, res) => {
    const { page_id } = req.body;

    try {
      const shareData = await Share.findActiveShareByPageId(page_id);
      Share.delete(shareData);
      debug("Share deleted", shareData.id);
      const result = { share: shareData.toObject() };
      return res.json(ApiResponse.success(result));
    } catch (err) {
      debug("Error occured while get setting", err, err.stack);
      return res.json(ApiResponse.error("Failed to delete share."));
    }
  };

  return actions;
};