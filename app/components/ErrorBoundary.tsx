import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@app/styles';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary to prevent the entire app from crashing
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.group('🛑 [ErrorBoundary] Caught an error');
        console.error('Error:', error);
        console.error('ErrorInfo:', errorInfo);
        console.groupEnd();
    }

    handleRestart = () => {
        this.setState({ hasError: false, error: null });
        // In a real app, you might want to trigger a native reload or navigate to home
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <View style={styles.container}>
                    <Text style={styles.icon}>⚠️</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        The application encountered an unexpected error and couldn't continue.
                    </Text>
                    {__DEV__ && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    icon: {
        fontSize: 64,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: Colors.gray400,
        textAlign: 'center',
        marginBottom: 30,
    },
    errorBox: {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        marginBottom: 30,
    },
    errorText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#D32F2F',
    },
    button: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ErrorBoundary;
