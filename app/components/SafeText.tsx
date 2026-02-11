import React from 'react';
import { Text, TextProps, View } from 'react-native';

interface SafeTextProps extends TextProps {
    children: React.ReactNode;
}

/**
 * A utility component that ensures text strings are always wrapped in a <Text> component.
 * It gracefully handles null, undefined, and non-string/number children.
 */
export const SafeText: React.FC<SafeTextProps> = ({ children, style, ...props }) => {
    // If no children, render nothing or an empty View/Text
    if (children === null || children === undefined) {
        return null;
    }

    // If children is already a string or number, wrap it in <Text>
    if (typeof children === 'string' || typeof children === 'number') {
        // Basic sanitization: if it's just whitespace and looks like it might be a bug
        const content = typeof children === 'string' ? children : children.toString();

        // Ignore pure empty strings or just single spaces if they're likely stray
        if (content.trim().length === 0) {
            return null;
        }

        return <Text style={style} {...props}>{content}</Text>;
    }

    // If children is already a valid React element, return it as is
    if (React.isValidElement(children)) {
        return children;
    }

    // If it's an array of elements/strings, map through them
    if (Array.isArray(children)) {
        return (
            <>
                {children.map((child, index) => (
                    <SafeText key={index} {...props} style={style}>
                        {child}
                    </SafeText>
                ))}
            </>
        );
    }

    // Fallback for objects or other types that shouldn't be rendered as text
    if (__DEV__) {
        console.warn('[SafeText] Attempted to render invalid child type:', typeof children);
    }

    return null;
};
