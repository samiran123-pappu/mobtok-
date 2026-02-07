// by default nextjs in every file server component
// in nextjs version 15 and 16 it by default store no cache so no need for mention:=>   cache: "no-store",


// "use client";
// function TasksPage() {
//   const response = await fetch("http://localhost:3000/api/tasks", {
//     cache: "no-store",
//   });
//   const tasks = await response.json();
//   console.log("tasks:", );
//   return <div>TasksPage</div>;
// }
// export default TasksPage;



// by default server component
async function TasksPage() {
  const response = await fetch("http://localhost:3000/api/tasks", {
    cache: "no-store",
  });
  const tasks = await response.json();
  console.log("tasks:", );
  return <div>TasksPage</div>;
}
export default TasksPage;




