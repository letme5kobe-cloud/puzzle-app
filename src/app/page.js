"use client";
import { useEffect, useRef, useState } from "react";

import princess1Image from "./princess1.png";
import princess2Image from "./princess2.png";
import robotImage from "./robot.png";
import dogcatImage from "./dogcat.png";

const correctTiles = [0, 1, 2, 3, 4, 5, 6, 7, ""]; 
const tileSize = 96;
const gap = 8;
const step = tileSize + gap;

const puzzleImages = [
  { id: "princess1", label: "ピンクのお姫様", image: princess1Image },
  { id: "princess2", label: "ブルーのお姫様", image: princess2Image },
  { id: "robot", label: "ロボット", image: robotImage },
  { id: "dogcat", label: "ドッグ＆キャット", image: dogcatImage },
];

function getMovableIndexes(emptyIndex) {
  const row = Math.floor(emptyIndex / 3);
  const col = emptyIndex % 3;
  const movableIndexes = [];

  if (row > 0) movableIndexes.push(emptyIndex - 3);
  if (row < 2) movableIndexes.push(emptyIndex + 3);
  if (col > 0) movableIndexes.push(emptyIndex - 1);
  if (col < 2) movableIndexes.push(emptyIndex + 1);

  return movableIndexes;
}

function createSolvableTiles(moveCount = 60) {
  const tiles = [...correctTiles];
  let emptyIndex = tiles.indexOf("");
  let previousEmptyIndex = null;

  for (let i = 0; i < moveCount; i++) {
    let movableIndexes = getMovableIndexes(emptyIndex);

    if (previousEmptyIndex !== null && movableIndexes.length > 1) {
      movableIndexes = movableIndexes.filter(
        (index) => index !== previousEmptyIndex
      );
    }

    const randomIndex =
      movableIndexes[Math.floor(Math.random() * movableIndexes.length)];

    tiles[emptyIndex] = tiles[randomIndex];
    tiles[randomIndex] = "";

    previousEmptyIndex = emptyIndex;
    emptyIndex = randomIndex;
  }

  if (isCompleted(tiles)) {
    return createSolvableTiles(moveCount + 10);
  }

  return tiles;
}

function isCompleted(tiles) {
  return tiles.every((tile, index) => tile === correctTiles[index]);
}

function playSuccessSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();

  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      frequency,
      audioContext.currentTime + index * 0.12
    );

    gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.12);
    gainNode.gain.linearRampToValueAtTime(
      0.18,
      audioContext.currentTime + index * 0.12 + 0.02
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + index * 0.12 + 0.25
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime + index * 0.12);
    oscillator.stop(audioContext.currentTime + index * 0.12 + 0.25);
  });
}

function playMoveSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(220, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.1
  );

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
}

export default function Home() {
  const [tiles, setTiles] = useState(correctTiles);
  const [effects, setEffects] = useState([]);
  const [isReady, setIsReady] = useState(false);

  const [selectedImage, setSelectedImage] = useState(puzzleImages[0]);

  const hasPlayedSuccessSound = useRef(false);
  const hasInitializedPuzzle = useRef(false);

  const completed = isReady && isCompleted(tiles);
  const emptyIndex = tiles.indexOf("");

  useEffect(() => {
    if (!hasInitializedPuzzle.current) {
      setTiles(createSolvableTiles());
      setIsReady(true);
      hasInitializedPuzzle.current = true;
    }
  }, []);

  useEffect(() => {
    if (completed && !hasPlayedSuccessSound.current) {
      playSuccessSound();
      hasPlayedSuccessSound.current = true;

      const newEffects = Array.from({ length: 28 }, (_, index) => ({
        id: index,
        mark: Math.random() > 0.5 ? "⭐" : "💖",
        left: `${Math.random() * 90 + 5}%`,
        top: `${Math.random() * 70 + 10}%`,
        delay: `${Math.random() * 0.4}s`,
      }));

      setEffects(newEffects);

      const timer = setTimeout(() => {
        setEffects([]);
      }, 1800);

      return () => clearTimeout(timer);
    }

    if (!completed) {
      hasPlayedSuccessSound.current = false;
    }
  }, [completed]);

  function handleClick(index) {
    setTiles((currentTiles) => {
      const newTiles = [...currentTiles];
      const emptyIndex = newTiles.indexOf("");

      const clickedRow = Math.floor(index / 3);
      const clickedCol = index % 3;
      const emptyRow = Math.floor(emptyIndex / 3);
      const emptyCol = emptyIndex % 3;

      const isNextToEmpty =
        Math.abs(clickedRow - emptyRow) + Math.abs(clickedCol - emptyCol) === 1;

      if (!isNextToEmpty) {
        return currentTiles;
      }

      playMoveSound();

      newTiles[emptyIndex] = newTiles[index];
      newTiles[index] = "";

      return newTiles;
    });
  }

  function resetPuzzle() {
    setTiles(createSolvableTiles());
    setEffects([]);
    hasPlayedSuccessSound.current = false;
  }

  function changePuzzleImage(image) {
    setSelectedImage(image);
    setTiles(createSolvableTiles());
    setEffects([]);
    hasPlayedSuccessSound.current = false;
  }

  return (
    <main
      className={`relative flex flex-col items-center justify-center h-screen gap-6 overflow-hidden transition-colors duration-500 ${
        completed ? "bg-yellow-100" : "bg-blue-100"
      }`}
    >
      {effects.map((effect) => (
        <span
          key={effect.id}
          className="pointer-events-none absolute text-3xl animate-bounce"
          style={{
            left: effect.left,
            top: effect.top,
            animationDelay: effect.delay,
          }}
        >
          {effect.mark}
        </span>
      ))}

      <h1 className="text-2xl font-bold text-blue-900">パズルあそび</h1>
      <p className="text-blue-800">空白のとなりにあるマスだけ動かせるよ</p>

      {completed && (
        <div className="rounded-xl bg-yellow-100 px-6 py-4 text-2xl font-bold text-yellow-700 shadow">
          できた！すごい！🎉
        </div>
      )}

      <div className="relative h-[304px] w-[304px] rounded-xl">
        {correctTiles.map((_, cellIndex) => (
          <div
            key={`cell-${cellIndex}`}
            className="pointer-events-none absolute h-24 w-24 rounded-lg border-2 border-gray-200 bg-transparent"
            style={{
              transform: `translate(${(cellIndex % 3) * step}px, ${
                Math.floor(cellIndex / 3) * step
              }px)`,
            }}
          />
        ))}

        <div
          className="pointer-events-none absolute h-24 w-24 rounded-lg border-2 border-gray-300 bg-gray-100"
          style={{
            transform: `translate(${(emptyIndex % 3) * step}px, ${
              Math.floor(emptyIndex / 3) * step
            }px)`,
          }}
        />

        {tiles.map((tile, index) => {
          if (tile === "") return null;

          return (
            <button
              key={tile}
              type="button"
              onClick={() => handleClick(index)}
              className="absolute z-10 h-24 w-24 cursor-pointer rounded-lg border-2 border-white bg-white shadow transition-transform duration-200 ease-out"
              style={{
                transform: `translate(${(index % 3) * step}px, ${
                  Math.floor(index / 3) * step
                }px)`,
                backgroundImage: `url("${selectedImage.image.src}")`,
                backgroundSize: "300% 300%",
                backgroundPosition: `${(tile % 3) * 50}% ${
                  Math.floor(tile / 3) * 50
                }%`,
              }}
              aria-label={`パネル${tile + 1}`}
            />
          );
        })}
      </div>

      <button
        onClick={resetPuzzle}
        className="rounded-full bg-blue-600 px-6 py-3 font-bold text-white shadow"
      >
        もういっかい
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2 px-4">
        {puzzleImages.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => changePuzzleImage(image)}
            className={`rounded-full px-4 py-2 text-sm font-bold shadow ${
              selectedImage.id === image.id
                ? "bg-pink-500 text-white"
                : "bg-white text-blue-800"
            }`}
          >
            {image.label}
          </button>
        ))}
      </div>
    </main>
  );
}