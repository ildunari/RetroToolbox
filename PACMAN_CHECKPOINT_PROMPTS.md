# PacMan Fix Checkpoint Prompts

## How to Use This Document
After each checkpoint completion, use `/compact` to clear the conversation, then copy the next prompt from this document to continue with the next phase.

---

## PROMPT 1: Phase 1 Critical Fixes - Type System & Properties
```
ULTRA THINK, THINK HARD, and THINK LONG for as long as possible about this task.

Read the following documents first:
1. PACMAN_IMPROVEMENT_PLAN.md - Review the CRITICAL FIXES section
2. PACMAN_TASKS.md - Focus on Phase 1 tasks (1.1, 1.2, 1.3, 1.4)
3. PACMAN_CHECKLIST.md - Review the CRITICAL section

Your task is to implement Phase 1 Critical Fixes for the PacMan game:

1. Fix all TypeScript type definitions (Ghost interface, GameState interface)
2. Add all missing properties to interfaces
3. Initialize all new properties in gameRef.current and initializeGame()
4. Implement the complete A* pathfinding algorithm
5. Remove excessive shadow effects for performance

Work on tasks 1.1, 1.2, 1.3, and 1.4 in parallel where possible. Think deeply about:
- The correct types for each property
- Proper initialization values
- The A* algorithm implementation details
- Performance implications of shadow removal

Test after each fix by running the game and checking console for errors. Update PACMAN_CHECKLIST.md as you complete each item.

Focus on making the game run without crashes first, optimization second.
```

---

## PROMPT 2: Phase 2 Core Gameplay - Ghost AI & Game States
```
ULTRA THINK, THINK HARD, and THINK LONG for as long as possible about this task.

Read the following documents first:
1. PACMAN_IMPROVEMENT_PLAN.md - Review the HIGH PRIORITY FIXES section
2. PACMAN_TASKS.md - Focus on Phase 2 tasks (2.1, 2.2, 2.3, 2.4)
3. PACMAN_CHECKLIST.md - Review what was completed in Phase 1

Your task is to implement Phase 2 Core Gameplay fixes:

1. Implement unique AI behaviors for each ghost:
   - Blinky: Direct chase of Pac-Man
   - Pinky: Target 4 tiles ahead of Pac-Man
   - Inky: Complex flanking using Blinky's position
   - Clyde: Chase when far, scatter when within 8 tiles

2. Fix ghost tunnel movement (wrap-around logic)
3. Implement proper game state transitions (death sequence, level complete)
4. Fix ghost scoring progression (200→400→800→1600)

Think deeply about:
- Each ghost's personality and targeting algorithm
- Smooth tunnel transitions for ghosts
- Game feel during state transitions
- Proper score multiplier management

Test ghost behaviors extensively. Each ghost should act differently. Update PACMAN_CHECKLIST.md as you progress.
```

---

## PROMPT 3: Phase 3 Quality of Life - Power-ups & Visual Feedback
```
ULTRA THINK, THINK HARD, and THINK LONG for as long as possible about this task.

Read the following documents first:
1. PACMAN_IMPROVEMENT_PLAN.md - Review the MEDIUM PRIORITY section
2. PACMAN_TASKS.md - Focus on Phase 3 tasks (3.1, 3.2, 3.3)
3. PACMAN_CHECKLIST.md - Verify Phase 1 & 2 are complete

Your task is to implement Phase 3 Quality of Life improvements:

1. Power-up system enhancements:
   - Implement magnet power-up (auto-collect nearby pellets)
   - Fix shield to properly block one hit
   - Add visual countdown timers

2. Visual feedback improvements:
   - Combo expiration indicator
   - Ghost point values when eaten
   - Frozen ghost visual state
   - Power-up spawn effects

3. Mobile optimization:
   - Implement adaptive quality settings
   - Add virtual D-pad option
   - Ensure 60fps on mobile devices

Think deeply about:
- User experience and game feel
- Visual clarity without cluttering the screen
- Performance impact of new effects
- Mobile-specific challenges

Test on both desktop and mobile. Update PACMAN_CHECKLIST.md with completed items.
```

---

## PROMPT 4: Phase 4 Polish & Final Testing
```
ULTRA THINK, THINK HARD, and THINK LONG for as long as possible about this task.

Read the following documents first:
1. PACMAN_IMPROVEMENT_PLAN.md - Review the LOW PRIORITY section and Testing Checklist
2. PACMAN_TASKS.md - Focus on Phase 4 tasks
3. PACMAN_CHECKLIST.md - Ensure all critical items are checked

Your task is to implement Phase 4 Polish and conduct final testing:

1. Audio enhancements:
   - Level complete sound
   - Ghost siren (changes with mode)
   - Power-up collection sounds

2. Final gameplay polish:
   - Fruit bonus items (appear twice per level)
   - Speed scaling per level
   - Any remaining visual polish

3. Comprehensive testing:
   - Full playthrough from level 1-5
   - Performance profiling
   - Mobile device testing
   - Memory leak detection

Think deeply about:
- Overall game polish and professional feel
- Edge cases and rare bugs
- Performance across all devices
- Long play session stability

Document any remaining issues. Update all checklists. Prepare final commit message summarizing all improvements.
```

---

## PROMPT 5: Post-Fix Verification & Documentation
```
ULTRA THINK, THINK HARD, and THINK LONG for as long as possible about this task.

Read ALL documents:
1. PACMAN_IMPROVEMENT_PLAN.md
2. PACMAN_TASKS.md
3. PACMAN_CHECKLIST.md
4. The updated PacManGame.tsx file

Your task is final verification and cleanup:

1. Verify all checklist items are complete
2. Run comprehensive tests:
   - No console errors
   - All ghost behaviors working
   - Power-ups functional
   - Mobile performance acceptable
   - Game states transition smoothly

3. Update documentation:
   - Update CHANGELOG.md with all fixes
   - Update README.md if needed
   - Mark all items in PACMAN_CHECKLIST.md as complete
   - Archive improvement documents

4. Create a comprehensive git commit with all changes

Think deeply about:
- Any missed edge cases
- Documentation completeness
- Code quality and maintainability
- Future improvement opportunities

This is the final checkpoint. Ensure the game is production-ready.
```

---

## Emergency Rollback Prompt
```
ULTRA THINK, THINK HARD, and THINK LONG for as long as possible about this task.

If something went critically wrong, use this prompt to analyze and fix:

1. Read the git diff to understand what changed
2. Check console errors in the browser
3. Read PACMAN_IMPROVEMENT_PLAN.md to understand intended fixes
4. Identify which phase introduced the bug
5. Implement targeted fix without breaking other improvements

Think deeply about:
- Root cause of the issue
- Minimal fix that preserves other improvements
- Testing strategy to prevent regression

Focus on stability first, features second.
```