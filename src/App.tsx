import { useTodos } from './hooks/useTodos';
import { Header } from './components/todo/Header';
import { TaskInput } from './components/todo/TaskInput';
import { FocusSection } from './components/todo/FocusSection';
import { InboxSection } from './components/todo/InboxSection';
import { ProgressCard } from './components/todo/ProgressCard';
import { SunsetReviewCard } from './components/todo/SunsetReviewCard';
import './App.css';

function App() {
  const {
    focusTodos,
    inboxTodos,
    stats,
    isFocusFull,
    reflection,
    isDayFinished,
    addTodo,
    toggleTodo,
    deleteTodo,
    promoteToToday,
    demoteToInbox,
    updateTodoTitle,
    saveSunsetReflection,
  } = useTodos();

  return (
    <div className="flowdo-app-wrapper">
      <main className="flowdo-main-container">
        {/* Header with Title, Date, and Mini Circular Progress */}
        <Header stats={stats} />

        {/* Top Quick Input Section */}
        <TaskInput onAdd={addTodo} isFocusFull={isFocusFull} />

        {/* Today's Focus Section (Rule of 3) */}
        <FocusSection
          todos={focusTodos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onDemote={demoteToInbox}
          onUpdateTitle={updateTodoTitle}
        />

        {/* Inbox / Someday Section */}
        <InboxSection
          todos={inboxTodos}
          onPromote={promoteToToday}
          onDelete={deleteTodo}
          isFocusFull={isFocusFull}
        />

        {/* Today's Progress Section */}
        <ProgressCard stats={stats} />

        {/* Evening Sunset Review Section */}
        <SunsetReviewCard
          stats={stats}
          initialReflection={reflection}
          isDayFinished={isDayFinished}
          onSaveReflection={saveSunsetReflection}
        />
      </main>
    </div>
  );
}

export default App;
