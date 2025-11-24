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

  static async addScript(req, res) {
    try {
      const { 
        scriptName, 
        scriptContent,
        label,
        endpoint,
        description,
        category,
        priority,
        timeout,
        maxRetries,
        scriptOptions,
        notifyOnError,
        notifyOnSuccess
      } = req.body;
      
      // Validate required fields
      if (!scriptName || !scriptContent) {
        return res.status(400).json({
          success: false,
          error: 'Script name and content are required'
        });
      }

      // Pass optional parameters
      const options = {
        label,
        endpoint,
        description,
        category,
        priority,
        timeout,
        maxRetries,
        scriptOptions,
        notifyOnError,
        notifyOnSuccess
      };

      const result = await ScriptService.addScript(scriptName, scriptContent, options);
      return res.status(201).json({ 
        success: true, 
        data: result,
        message: result.message || 'Script added successfully'
      });
    } catch (error) {
      console.error(`Add script failed: ${error.message}`);
      
      // Provide more specific error status codes
      const statusCode = error.message.includes('already exists') ? 409 : 
                         error.message.includes('syntax') ? 400 : 500;
      
      return res.status(statusCode).json({
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

  static async getScriptsDashboardView(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.getScriptsDashboardView()
    );
  }

  static async cleanupStaleScripts(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.markStaleInProgressScriptsAsFailed()
    );
  }

  static async cleanupAllInProgressScripts(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.markAllInProgressScriptsAsFailed()
    );
  }

  static async resetAllScriptsToSuccess(req, res) {
    return ScriptController.sendResponse(res, () => 
      ScriptService.resetAllScriptsToSuccess()
    );
  }
}

module.exports = ScriptController;