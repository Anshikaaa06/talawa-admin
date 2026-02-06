import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import {
  VERIFY_EMAIL_MUTATION,
  RESEND_VERIFICATION_EMAIL_MUTATION,
} from 'GraphQl/Mutations/mutations';
import { store } from 'state/store';
import { StaticMockLink } from 'utils/StaticMockLink';
import VerifyEmail from './VerifyEmail';
import i18n from 'utils/i18nForTest';
import { vi, beforeEach, afterEach, expect, it, describe } from 'vitest';

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('utils/i18n', async () => {
  const i18n = await import('utils/i18nForTest');
  return {
    default: i18n.default,
  };
});

vi.mock('components/NotificationToast/NotificationToast', () => ({
  NotificationToast: {
    success: toastMocks.success,
    error: toastMocks.error,
    warning: toastMocks.warning,
    warn: toastMocks.warn,
  },
}));

// --- STANDARD MOCKS ---
const MOCKS = [
  {
    request: {
      query: VERIFY_EMAIL_MUTATION,
      variables: { token: 'valid-token' },
    },
    result: {
      data: {
        verifyEmail: {
          success: true,
          message: 'Email verified successfully',
          user: {
            id: '123',
            name: 'Test User',
            emailAddress: 'test@example.com',
            isEmailAddressVerified: true,
          },
        },
      },
    },
  },
  {
    request: {
      query: VERIFY_EMAIL_MUTATION,
      variables: { token: 'invalid-token' },
    },
    error: new Error('Invalid or expired token'),
  },
  {
    request: { query: RESEND_VERIFICATION_EMAIL_MUTATION },
    result: {
      data: {
        sendVerificationEmail: {
          success: true,
          message: 'Verification email sent',
        },
      },
    },
  },
];

const resendErrorMock = {
  request: { query: RESEND_VERIFICATION_EMAIL_MUTATION },
  error: new Error('User not found'),
};

const link = new StaticMockLink(MOCKS, true);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('Testing VerifyEmail screen', () => {
  // 1. Loading State
  it('Component should be rendered properly with loading state', async () => {
    const mockObj = {
      request: {
        query: VERIFY_EMAIL_MUTATION,
        variables: { token: 'valid-token' },
      },
      result: {
        data: {
          verifyEmail: {
            success: true,
            message: 'Verified',
            user: {
              id: '123',
              name: 'T',
              emailAddress: 't@t.com',
              isEmailAddressVerified: true,
            },
          },
        },
      },
      delay: 100,
    };
    render(
      <MockedProvider mocks={[mockObj, mockObj]} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email?token=valid-token']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    await waitFor(
      () => {
        expect(screen.getByTestId('success-state')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  // 2. Success State
  it('Should show success state after successful verification', async () => {
    render(
      <MockedProvider link={link} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email?token=valid-token']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('success-state')).toBeInTheDocument(),
    );
    expect(toastMocks.success).toHaveBeenCalled();
  });

  // 3. Navigation
  it('Should navigate to login when Go to Login button is clicked', async () => {
    render(
      <MockedProvider link={link} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email?token=valid-token']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('success-state')).toBeInTheDocument(),
    );
    const goToLoginBtn = screen.getByTestId('goToLoginBtn');
    await userEvent.click(goToLoginBtn);
  });

  // 4. Missing Token (Error State)
  it('Should show error state when token is missing', async () => {
    render(
      <MockedProvider link={link} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
  });

  // 5. Generic Verification Failure
  it('Should show error state when verification fails', async () => {
    render(
      <MockedProvider link={link} addTypename={false}>
        <MemoryRouter
          initialEntries={['/auth/verify-email?token=invalid-token']}
        >
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
  });

  // 6. Resend Logic
  it('Should successfully resend verification email', async () => {
    render(
      <MockedProvider link={link} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
    const resendBtn = screen.getByTestId('resendVerificationBtn');
    await userEvent.click(resendBtn);
    await waitFor(() => expect(toastMocks.success).toHaveBeenCalled());
  });

  // 7. Resend Error
  it('Should handle resend email error', async () => {
    render(
      <MockedProvider mocks={[resendErrorMock]} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
    const resendBtn = screen.getByTestId('resendVerificationBtn');
    await userEvent.click(resendBtn);
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalled());
  });

  // 8. Resend Failure (Success: false)
  it('Should handle resend email failure (api returns false)', async () => {
    const resendFailureMock = {
      request: { query: RESEND_VERIFICATION_EMAIL_MUTATION },
      result: {
        data: {
          sendVerificationEmail: {
            success: false,
            message: 'Failed to resend',
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[resendFailureMock]} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
    const resendBtn = screen.getByTestId('resendVerificationBtn');
    await userEvent.click(resendBtn);
    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('Failed to resend'),
    );
  });

  // 9. Back Link
  it('Should have back to login link in error state', async () => {
    render(
      <MockedProvider link={link} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
    const backLink = screen.getByTestId('backToLoginLink');
    expect(backLink).toBeInTheDocument();
  });

  // 10. API Returns Success: False
  it('Should show error state when verification success is false', async () => {
    const successFalseMock = {
      request: {
        query: VERIFY_EMAIL_MUTATION,
        variables: { token: 'fail-token' },
      },
      result: {
        data: {
          verifyEmail: {
            success: false,
            message: 'Verification failed',
            user: null,
          },
        },
      },
    };

    render(
      <MockedProvider
        mocks={[successFalseMock, successFalseMock]}
        addTypename={false}
      >
        <MemoryRouter initialEntries={['/auth/verify-email?token=fail-token']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
  });

  // --- BRANCH COVERAGE TESTS (Lines 95-96) ---

  // 11. Path A: Error message includes "authenticated"
  it('Should hit Line 95: "Login Required" when error message includes "authenticated"', async () => {
    const authMsgMock = {
      request: {
        query: VERIFY_EMAIL_MUTATION,
        variables: { token: 'auth-msg-token' },
      },
      error: new Error('User is not authenticated at all'),
    };

    render(
      <MockedProvider mocks={[authMsgMock, authMsgMock]} addTypename={false}>
        <MemoryRouter
          initialEntries={['/auth/verify-email?token=auth-msg-token']}
        >
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
    expect(toastMocks.error).toHaveBeenCalledWith(
      'Please login to verify your email.',
    );
  });

  // 12. Path B: Error Code is UNAUTHENTICATED
  it('Should hit Line 96 (Part 1): "Login Required" when error code is UNAUTHENTICATED', async () => {
    const unauthMock = {
      request: {
        query: VERIFY_EMAIL_MUTATION,
        variables: { token: 'unauth-token' },
      },
      result: {
        data: null,
        errors: [
          {
            message: 'Generic error message',
            extensions: { code: 'UNAUTHENTICATED' },
          },
        ],
      },
    };

    render(
      <MockedProvider mocks={[unauthMock, unauthMock]} addTypename={false}>
        <MemoryRouter
          initialEntries={['/auth/verify-email?token=unauth-token']}
        >
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
    expect(toastMocks.error).toHaveBeenCalledWith(
      'Please login to verify your email.',
    );
  });

  // 13. Path C: Error message includes "invalid arguments"
  it('Should hit Line 96 (Part 2): "Login Required" when error message includes "invalid arguments"', async () => {
    const invalidArgsMock = {
      request: {
        query: VERIFY_EMAIL_MUTATION,
        variables: { token: 'args-token' },
      },
      error: new Error('System halted due to invalid arguments provided'),
    };

    render(
      <MockedProvider
        mocks={[invalidArgsMock, invalidArgsMock]}
        addTypename={false}
      >
        <MemoryRouter initialEntries={['/auth/verify-email?token=args-token']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );
    expect(toastMocks.error).toHaveBeenCalledWith(
      'Please login to verify your email.',
    );
  });

  // --- UNMOUNT GUARD TESTS (Line 111) ---

  // 14. Unmount Guard (Cleanup) - Success Path
  it('Should handle component unmount before verification completes', async () => {
    const delayedSuccessMock = {
      request: {
        query: VERIFY_EMAIL_MUTATION,
        variables: { token: 'delayed-success' },
      },
      result: {
        data: {
          verifyEmail: {
            success: true,
            message: 'Verified',
            user: {
              id: '1',
              name: 'T',
              emailAddress: 't@t.com',
              isEmailAddressVerified: true,
            },
          },
        },
      },
      delay: 50,
    };

    const { unmount } = render(
      <MockedProvider mocks={[delayedSuccessMock]} addTypename={false}>
        <MemoryRouter
          initialEntries={['/auth/verify-email?token=delayed-success']}
        >
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  // 15. Unmount Guard (Cleanup) - Error Path
  it('Should handle component unmount before verification fails', async () => {
    const delayedErrorMock = {
      request: {
        query: VERIFY_EMAIL_MUTATION,
        variables: { token: 'delayed-error' },
      },
      error: new Error('Network error'),
      delay: 50,
    };

    const { unmount } = render(
      <MockedProvider mocks={[delayedErrorMock]} addTypename={false}>
        <MemoryRouter
          initialEntries={['/auth/verify-email?token=delayed-error']}
        >
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  // 16. Optional Chaining Coverage (Lines 95-96)
  it('Should handle error object with undefined message', async () => {
    const weirdError = {
      graphQLErrors: [],
      networkError: null,
      extraInfo: null,
      name: 'WeirdError',
      // message is deliberately undefined to test "err.message?."
    };

    const noMsgMock = {
      request: {
        query: VERIFY_EMAIL_MUTATION,
        variables: { token: 'no-msg-token' },
      },
      error: weirdError as unknown as Error,
    };

    render(
      <MockedProvider mocks={[noMsgMock]} addTypename={false}>
        <MemoryRouter
          initialEntries={['/auth/verify-email?token=no-msg-token']}
        >
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
  });

  // ✅ 17. Resend Failure with NO Message (Covers Line 137)
  it('Should use default error message when resend fails with no message', async () => {
    const resendNoMsgMock = {
      request: { query: RESEND_VERIFICATION_EMAIL_MUTATION },
      result: {
        data: {
          sendVerificationEmail: {
            success: false,
            message: null, // This triggers the || 'resendFailed' branch
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[resendNoMsgMock]} addTypename={false}>
        <MemoryRouter initialEntries={['/auth/verify-email']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <VerifyEmail />
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument(),
    );

    // Click resend button
    const resendBtn = screen.getByTestId('resendVerificationBtn');
    await userEvent.click(resendBtn);

    // Expect the fallback translation key 'resendFailed' because message was null
    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith(
        'Failed to resend verification email. Please try again.',
      ),
    );
  });
});
