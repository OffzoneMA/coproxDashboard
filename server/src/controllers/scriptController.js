const ScriptService = require('../services/scriptService');

class ScriptController {
  static async sendResponse(res, operation) {
    try {
      const data = await operation();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error(`Operation failed: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async updateScriptStatus(req, res) {
    const { scriptName, status, option } = req.body;
    return ScriptController.sendResponse(res, () => 
      ScriptService.updateScriptStatus(scriptName, status, option)
    );
  }

  static async getScriptStateLogs(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.getScriptStateLogs()
    );
  }

  static async logScriptStart(req, res) {
    const { scriptName, option } = req.body;
    return ScriptController.sendResponse(res, () => 
      ScriptService.logScriptStart(scriptName, option)
    );
  }

  static async updateLogStatus(req, res) {
    const { scriptName, logId, status, message, apiCalls } = req.body;
    return ScriptController.sendResponse(res, () => 
      ScriptService.updateLogStatus(scriptName, logId, status, message, apiCalls)
    );
  }

  static async getListScripts(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.getListScripts()
    );
  }
}

module.exports = ScriptController;