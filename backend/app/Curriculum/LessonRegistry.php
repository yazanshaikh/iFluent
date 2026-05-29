<?php

namespace App\Curriculum;

/**
 * Central registry of every lesson class in the system.
 *
 * Usage:
 *   $class  = LessonRegistry::get('A1', 5);   // App\Curriculum\A1\Lesson5
 *   $exists = LessonRegistry::exists('B2', 1);
 *   $all    = LessonRegistry::forLevel('A1');  // array of class strings
 *
 * Lesson classes follow the naming convention:
 *   App\Curriculum\{LEVEL}\Lesson{N}
 * where LEVEL is uppercase (A1, A2, B1 …) and N is the 1-based lesson number.
 *
 * Adding a new level/lesson is as simple as creating the PHP file —
 * no registration needed as long as the naming convention is followed.
 */
class LessonRegistry
{
    /**
     * Resolve the fully-qualified class name for a lesson.
     * Returns null when the class file does not exist.
     */
    public static function get(string $levelCode, int $lessonNumber): ?string
    {
        $class = 'App\\Curriculum\\' . strtoupper($levelCode) . '\\Lesson' . $lessonNumber;

        return class_exists($class) ? $class : null;
    }

    /**
     * Whether a lesson class exists for the given level + number.
     */
    public static function exists(string $levelCode, int $lessonNumber): bool
    {
        return static::get($levelCode, $lessonNumber) !== null;
    }

    /**
     * Return all lesson class names that exist for a given level,
     * ordered by lesson number ascending.
     *
     * Scans Lesson1 … Lesson200 — stops when three consecutive numbers
     * are missing (avoids scanning the entire integer range).
     */
    public static function forLevel(string $levelCode): array
    {
        $classes = [];
        $misses  = 0;

        for ($n = 1; $n <= 200; $n++) {
            $class = static::get($levelCode, $n);

            if ($class !== null) {
                $classes[] = $class;
                $misses    = 0;
            } else {
                $misses++;
                if ($misses >= 3) {
                    break;
                }
            }
        }

        return $classes;
    }

    /**
     * Return all known level codes by scanning the Curriculum directory.
     *
     * @return string[]  e.g. ['A1', 'A2', 'B1']
     */
    public static function levels(): array
    {
        $base   = app_path('Curriculum');
        $dirs   = glob($base . '/*', GLOB_ONLYDIR);
        $levels = [];

        foreach ($dirs as $dir) {
            $name = basename($dir);
            // Skip non-level directories (e.g. any lowercase helper dirs)
            if (preg_match('/^[A-Z]\d+$/', $name)) {
                $levels[] = $name;
            }
        }

        sort($levels);
        return $levels;
    }

    /**
     * Return a flat array of all lesson classes across all levels.
     *
     * @return string[]
     */
    public static function all(): array
    {
        $all = [];
        foreach (static::levels() as $level) {
            foreach (static::forLevel($level) as $class) {
                $all[] = $class;
            }
        }
        return $all;
    }
}
