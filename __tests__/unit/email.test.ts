import { describe, it, expect, vi } from 'vitest';
import { sendInvitationEmail } from '@/lib/email/email';
import { Resend } from 'resend';

// Mock the Resend client
vi.mock('resend', () => {
    const Resend = vi.fn();
    Resend.prototype.emails = {
        send: vi.fn(),
    };
    return { Resend };
});

const resendInstance = new Resend();

describe('Email Sending Logic', () => {

    it('should call the Resend API with the correct parameters', async () => {
        const params = {
            to: 'test@example.com',
            teamName: 'Test Team',
            role: 'admin',
            inviteId: 123,
            inviterEmail: 'inviter@example.com',
        };

        (resendInstance.emails.send as vi.Mock).mockResolvedValue({ error: null });

        await sendInvitationEmail(params);

        expect(resendInstance.emails.send).toHaveBeenCalledOnce();
        const callArgs = (resendInstance.emails.send as vi.Mock).mock.calls[0][0];

        expect(callArgs.to).toEqual([params.to]);
        expect(callArgs.subject).toContain(params.teamName);
        expect(callArgs.html).toContain(params.teamName);
        expect(callArgs.html).toContain('Администратор');
        expect(callArgs.html).toContain(`/invitations?inviteId=${params.inviteId}`);
        expect(callArgs.html).toContain(params.inviterEmail);
    });

    it('should handle API errors gracefully', async () => {
        const params = { to: 'test@example.com', teamName: 'Test Team', role: 'admin', inviteId: 123 };
        const errorMessage = 'API Error';

        (resendInstance.emails.send as vi.Mock).mockResolvedValue({ error: { message: errorMessage } });

        // Suppress console.error for this test
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await sendInvitationEmail(params);

        expect(result.success).toBe(false);
        consoleErrorSpy.mockRestore();
        expect(result.error).toBe(errorMessage);
    });
});
