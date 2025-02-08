import type { BrowserAction } from './types';

class ContentScriptHandler {
  private async findElement(selector: string, timeout: number = 30000): Promise<Element> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Element not found: ${selector} (timeout: ${timeout}ms)`);
  }

  async click(action: BrowserAction): Promise<boolean> {
    if (!action.selector) {
      throw new Error('Selector is required for click action');
    }
    const element = await this.findElement(action.selector, action.timeout);
    if (element instanceof HTMLElement) {
      element.click();
      return true;
    }
    throw new Error('Element is not clickable');
  }

  async input(action: BrowserAction): Promise<boolean> {
    if (!action.selector) {
      throw new Error('Selector is required for input action');
    }
    const element = await this.findElement(action.selector, action.timeout);
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = action.value || '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    throw new Error('Element is not an input or textarea');
  }

  async scrape(action: BrowserAction): Promise<string> {
    if (!action.selector) {
      throw new Error('Selector is required for scrape action');
    }
    const element = await this.findElement(action.selector, action.timeout);
    return element.textContent || '';
  }

  async wait(action: BrowserAction): Promise<boolean> {
    if (!action.selector) {
      throw new Error('Selector is required for wait action');
    }
    await this.findElement(action.selector, action.timeout);
    return true;
  }

  async execute(action: BrowserAction): Promise<any> {
    console.log('Executing content script action:', action);

    try {
      switch (action.type) {
        case 'click':
          return await this.click(action);
        case 'input':
          return await this.input(action);
        case 'scrape':
          return await this.scrape(action);
        case 'wait':
          return await this.wait(action);
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }
    } catch (error) {
      console.error('Content script action failed:', error);
      throw error;
    }
  }
}

// Initialize handler
const handler = new ContentScriptHandler();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  if (message.type === 'EXECUTE_ACTION' && message.action) {
    handler.execute(message.action)
      .then(result => {
        console.log('Action executed successfully:', result);
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Action execution failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
}); 