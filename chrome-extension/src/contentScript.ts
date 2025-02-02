import type { Message, BrowserAction, BrowserActionResponse } from './types';

class DOMController {
  private async findElement(selector: string, timeout: number = 30000): Promise<Element | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }

  private async executeClick(action: BrowserAction): Promise<BrowserActionResponse> {
    const element = await this.findElement(action.selector, action.timeout);
    
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${action.selector}`
      };
    }

    try {
      (element as HTMLElement).click();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to click element: ${error}`
      };
    }
  }

  private async executeInput(action: BrowserAction): Promise<BrowserActionResponse> {
    const element = await this.findElement(action.selector, action.timeout);
    
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${action.selector}`
      };
    }

    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      return {
        success: false,
        error: 'Element is not an input or textarea'
      };
    }

    try {
      element.value = action.value || '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set input value: ${error}`
      };
    }
  }

  private async executeScrape(action: BrowserAction): Promise<BrowserActionResponse> {
    const element = await this.findElement(action.selector, action.timeout);
    
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${action.selector}`
      };
    }

    try {
      const text = element.textContent?.trim();
      return {
        success: true,
        data: text
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to scrape element: ${error}`
      };
    }
  }

  private async executeWait(action: BrowserAction): Promise<BrowserActionResponse> {
    const element = await this.findElement(action.selector, action.timeout);
    
    return element
      ? { success: true }
      : {
          success: false,
          error: `Timeout waiting for element: ${action.selector}`
        };
  }

  public async executeAction(action: BrowserAction): Promise<BrowserActionResponse> {
    switch (action.type) {
      case 'click':
        return this.executeClick(action);
      case 'input':
        return this.executeInput(action);
      case 'scrape':
        return this.executeScrape(action);
      case 'wait':
        return this.executeWait(action);
      default:
        return {
          success: false,
          error: `Unknown action type: ${(action as any).type}`
        };
    }
  }
}

const controller = new DOMController();

console.log('Overseer content script loaded');

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  sendResponse({ received: true });
  return true;
}); 