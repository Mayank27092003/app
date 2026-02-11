export interface EmailAttachment {
    filename: string;
    content: Buffer;
    contentType?: string;
}

export interface EmailPayload {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    attachments?: EmailAttachment[];
}

export interface EmailProvider {
    sendEmail(payload: EmailPayload): Promise<void>;
}
