# File Upload Utilities

This module provides utilities for uploading files to the server using Redux Saga.

## Usage

### Basic File Upload

```typescript
import { uploadFileToServer, createFileDataFromAsset } from '@app/utils';
import { useDispatch } from 'react-redux';

function MyComponent() {
  const dispatch = useDispatch();

  const uploadFile = () => {
    const fileData = {
      uri: 'file://path/to/file.jpg',
      type: 'image/jpeg',
      name: 'my-file.jpg'
    };

    uploadFileToServer(
      fileData,
      dispatch,
      (response) => {
        console.log('Upload successful:', response);
        // Handle success
      },
      (error) => {
        console.log('Upload failed:', error);
        // Handle error
      }
    );
  };
}
```

### With Image Picker

```typescript
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadFileToServer, createFileDataFromAsset } from '@app/utils';
import { useDispatch } from 'react-redux';

function MyComponent() {
  const dispatch = useDispatch();

  const pickAndUpload = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.8,
      },
      async (response) => {
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const fileData = createFileDataFromAsset(asset, 'custom-name.jpg');
          
          uploadFileToServer(
            fileData,
            dispatch,
            (response) => {
              console.log('Upload successful:', response);
            },
            (error) => {
              console.log('Upload failed:', error);
            }
          );
        }
      }
    );
  };
}
```

### File Validation

```typescript
import { validateFile } from '@app/utils';

const fileData = {
  uri: 'file://path/to/file.jpg',
  type: 'image/jpeg',
  name: 'my-file.jpg'
};

const validation = validateFile(fileData);
if (validation.isValid) {
  // Proceed with upload
  uploadFileToServer(fileData, dispatch);
} else {
  console.log('Validation error:', validation.error);
}
```

## API Endpoint

The file upload uses the `/api/v1/upload` endpoint with `multipart/form-data` content type.

## Features

- ✅ Redux Saga integration
- ✅ Automatic loading state management
- ✅ Success/error callbacks
- ✅ File validation
- ✅ Image picker integration
- ✅ Progress feedback via flash messages
- ✅ TypeScript support 