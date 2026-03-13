export interface CapturedSelection {
  text: string
  textQuote: {
    exact: string
    prefix?: string
    suffix?: string
  }
  textPosition?: {
    start: number
    end: number
  }
  domSelector?: {
    elementId?: string
    cssSelector?: string
  }
}

export interface DocumentInfo {
  uri: string
  title?: string | undefined
}

export interface ClipboardWriteOptions {
  /**
   * If true, skip writing text/html to the clipboard.
   * Useful when the site already handles HTML content.
   */
  skipHtml?: boolean
}
