import { useQRCode } from 'next-qrcode';

function QRCodeComponent() {
  const { Canvas } = useQRCode();

  return (
    <Canvas
      text={'https://github.com/bunlong/next-qrcode'}
      options={{
        level: 'M',
        margin: 3,
        scale: 4,
        width: 200,
        color: {
          dark: '#010599FF',
          light: '#FFBF00FF',
        },
      }}
    />
  );
}
